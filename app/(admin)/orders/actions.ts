"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Telegraf } from "telegraf";

import { db } from "@/db";
import { orders, products, stocks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function approveOrder(formData: FormData) {
  await requireAdmin();

  const orderId = Number(formData.get("id"));

  if (!Number.isInteger(orderId)) {
    throw new Error("Order tidak valid.");
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi.");
  }

  // Ambil order
  const [order] = await db
    .select({
      id: orders.id,
      telegramId: orders.telegramId,
      productId: orders.productId,
      quantity: orders.quantity,
      status: orders.status,
      productName: products.name,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order tidak ditemukan.");
  }

  if (order.status !== "PENDING") {
    throw new Error("Order ini sudah diproses.");
  }

  // Tandai PROCESSING dulu untuk mencegah double approve.
  const processing = await db
    .update(orders)
    .set({
      status: "PROCESSING",
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "PENDING")))
    .returning({
      id: orders.id,
    });

  if (processing.length === 0) {
    throw new Error("Order sedang atau sudah diproses.");
  }

  try {
    // Ambil stock yang belum terjual.
    const availableStocks = await db
      .select()
      .from(stocks)
      .where(
        and(eq(stocks.productId, order.productId), eq(stocks.isSold, false)),
      )
      .limit(order.quantity);

    if (availableStocks.length < order.quantity) {
      await db
        .update(orders)
        .set({
          status: "PENDING",
        })
        .where(eq(orders.id, orderId));

      throw new Error(
        `Stock tidak cukup. Dibutuhkan ${order.quantity}, tersedia ${availableStocks.length}.`,
      );
    }

    const stockIds = availableStocks.map((stock) => stock.id);

    const accountData = availableStocks
      .map((stock, index) => `${index + 1}. ${stock.accountData}`)
      .join("\n");

    // Reserve stock.
    //
    // Kita update satu per satu agar setiap update tetap memastikan
    // stock tersebut belum terjual.
    for (const stockId of stockIds) {
      const updated = await db
        .update(stocks)
        .set({
          isSold: true,
        })
        .where(and(eq(stocks.id, stockId), eq(stocks.isSold, false)))
        .returning({
          id: stocks.id,
        });

      if (updated.length === 0) {
        throw new Error(
          "Sebagian stock sudah diambil order lain. Silakan coba lagi.",
        );
      }
    }

    const bot = new Telegraf(token);

    try {
      await bot.telegram.sendMessage(
        order.telegramId,
        [
          "✅ <b>Pembayaran Berhasil Diverifikasi!</b>",
          "",
          `Pesanan #${order.id}`,
          `Produk: <b>${escapeHtml(order.productName)}</b>`,
          `Jumlah: ${order.quantity} akun`,
          "",
          "🔐 <b>Data Akun:</b>",
          `<pre>${escapeHtml(accountData)}</pre>`,
          "",
          "Terima kasih sudah berbelanja di SN Store 🙏",
        ].join("\n"),
        {
          parse_mode: "HTML",
        },
      );
    } catch (error) {
      // Telegram gagal -> kembalikan stock.
      for (const stockId of stockIds) {
        await db
          .update(stocks)
          .set({
            isSold: false,
          })
          .where(eq(stocks.id, stockId));
      }

      await db
        .update(orders)
        .set({
          status: "PENDING",
        })
        .where(eq(orders.id, orderId));

      console.error("[Order Telegram Error]", error);

      throw new Error(
        "Gagal mengirim akun ke Telegram. Order dikembalikan ke Pending.",
      );
    }

    // Telegram berhasil -> selesaikan order.
    await db
      .update(orders)
      .set({
        status: "SUCCESS",
        sentAccountData: accountData,
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/orders");
    revalidatePath("/dashboard");
    revalidatePath("/products");
  } catch (error) {
    // Kalau masih PROCESSING karena error sebelum Telegram,
    // kembalikan menjadi PENDING.
    await db
      .update(orders)
      .set({
        status: "PENDING",
      })
      .where(and(eq(orders.id, orderId), eq(orders.status, "PROCESSING")));

    throw error;
  }
}

export async function rejectOrder(formData: FormData) {
  await requireAdmin();

  const orderId = Number(formData.get("id"));

  if (!Number.isInteger(orderId)) {
    throw new Error("Order tidak valid.");
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi.");
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order tidak ditemukan.");
  }

  if (order.status !== "PENDING") {
    throw new Error("Order ini sudah diproses.");
  }

  await db
    .update(orders)
    .set({
      status: "REJECTED",
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "PENDING")));

  const bot = new Telegraf(token);

  try {
    await bot.telegram.sendMessage(
      order.telegramId,
      [
        "❌ <b>Pembayaran Belum Dapat Diverifikasi</b>",
        "",
        `Pesanan #${order.id} ditolak oleh Admin.`,
        "",
        "Silakan periksa kembali bukti pembayaran Anda atau hubungi Admin.",
      ].join("\n"),
      {
        parse_mode: "HTML",
      },
    );
  } catch (error) {
    console.error("[Reject Notification Error]", error);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
