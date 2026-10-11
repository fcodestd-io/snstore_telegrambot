import { and, eq } from "drizzle-orm";

import { Context, Telegraf } from "telegraf";

import { db } from "@/db";

import { botCommands, orders, payments, products, stocks } from "@/db/schema";

import { getChatHistory, saveChatMessage } from "@/lib/chat-history";

import { createCustomerService } from "@/lib/ai/customer-service";

import {
  chunkText,
  escapeHtml,
  formatRupiah,
  parseQuantity,
} from "@/lib/utils";

// ==========================================================
// CONSTANTS
// ==========================================================

const RESERVED_COMMANDS = ["start", "katalog", "payment"];

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_PENDING_ORDERS = 3;

// ==========================================================
// TYPES
// ==========================================================

type ProductWithStock = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  stock: number;
};

// ==========================================================
// BOT
// ==========================================================

export function setupBot(token: string, apiKey: string) {
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi.");
  }

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY belum dikonfigurasi.");
  }

  const bot = new Telegraf(token, {
    handlerTimeout: 90_000,
  });

  const askCustomerService = createCustomerService(apiKey);

  // ========================================================
  // HELPERS
  // ========================================================

  function isPrivate(ctx: Context) {
    return ctx.chat?.type === "private";
  }

  async function sendTyping(ctx: Context) {
    try {
      await ctx.sendChatAction("typing");
    } catch {
      // Typing indicator bukan proses penting.
    }
  }

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[?!.,;:'"`~()[\]{}]/g, " ")
      .replace(/\s+/g, " ");
  }

  // ========================================================
  // PRODUCT DATA
  // ========================================================

  async function getProductsWithStock(): Promise<ProductWithStock[]> {
    const [productList, availableStocks] = await Promise.all([
      db.select().from(products),

      db
        .select({
          productId: stocks.productId,
        })
        .from(stocks)
        .where(eq(stocks.isSold, false)),
    ]);

    const stockMap = new Map<number, number>();

    for (const stock of availableStocks) {
      stockMap.set(stock.productId, (stockMap.get(stock.productId) ?? 0) + 1);
    }

    return productList.map((product) => ({
      id: product.id,

      name: product.name,

      price: Number(product.price),

      description: product.description,

      stock: stockMap.get(product.id) ?? 0,
    }));
  }

  // ========================================================
  // PRODUCT MATCHER
  //
  // Dipakai untuk payment proof.
  // BUKAN untuk meng-hardcode percakapan customer.
  // ========================================================

  function findProduct(message: string, productList: ProductWithStock[]) {
    const normalized = normalizeText(message);

    const words = normalized.split(" ");

    return [...productList]
      .sort((a, b) => b.name.length - a.name.length)
      .find((product) => {
        const productName = normalizeText(product.name);

        if (normalized.includes(productName)) {
          return true;
        }

        const firstWord = productName.split(" ")[0];

        if (firstWord.length >= 2 && words.includes(firstWord)) {
          return true;
        }

        return false;
      });
  }

  // ========================================================
  // HTML CHUNKS
  // ========================================================

  async function replyHtmlChunked(ctx: Context, text: string) {
    const chunks = chunkText(text);

    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        parse_mode: "HTML",
      });
    }
  }

  // ========================================================
  // CATALOG
  // ========================================================

  async function sendCatalog(ctx: Context) {
    try {
      await sendTyping(ctx);

      const productList = await getProductsWithStock();

      if (productList.length === 0) {
        await ctx.reply("Saat ini katalog produk belum tersedia.");

        return;
      }

      let message = "📦 <b>KATALOG SN STORE</b>\n\n";

      productList.forEach((product, index) => {
        message += `${index + 1}. <b>${escapeHtml(product.name)}</b>\n`;

        message += `💰 Rp ${formatRupiah(product.price)}\n`;

        message += `📊 Stok: <b>${product.stock}</b>\n`;

        if (product.description) {
          message += `📝 ${escapeHtml(product.description)}\n`;
        }

        message += "\n";
      });

      message += "Kak bisa langsung chat nama produk dan jumlah.\n";

      message += 'Contoh: <b>"Canva 2"</b>';

      await replyHtmlChunked(ctx, message);
    } catch (error) {
      console.error("[Catalog Error]", error);

      await ctx.reply(
        "Maaf Kak, katalog sedang gagal dimuat. Coba lagi sebentar ya 🙏",
      );
    }
  }

  // ========================================================
  // PAYMENTS
  // ========================================================

  async function sendPayments(ctx: Context) {
    try {
      await sendTyping(ctx);

      const paymentList = await db
        .select()
        .from(payments)
        .where(eq(payments.isActive, true));

      if (paymentList.length === 0) {
        await ctx.reply("Metode pembayaran belum tersedia Kak.");

        return;
      }

      for (const payment of paymentList) {
        let caption = `💳 <b>${escapeHtml(payment.name)}</b>\n\n`;

        if (payment.accountNumber) {
          caption += `Nomor: <code>${escapeHtml(
            payment.accountNumber,
          )}</code>\n`;
        }

        if (payment.accountName) {
          caption += `Atas nama: ${escapeHtml(payment.accountName)}\n`;
        }

        caption +=
          "\nSetelah transfer, kirim <b>gambar bukti pembayaran</b> ke chat ini.";

        caption += "\nTambahkan nama produk dan jumlah pada caption.";

        caption += "\nContoh: <code>Canva 2</code>";

        // --------------------------------------
        // BASE64 IMAGE
        // --------------------------------------

        if (payment.imageUrl?.startsWith("data:image")) {
          try {
            const base64 = payment.imageUrl.split(",")[1];

            if (!base64) {
              throw new Error("Invalid base64 image.");
            }

            await ctx.replyWithPhoto(
              {
                source: Buffer.from(base64, "base64"),
              },
              {
                caption,
                parse_mode: "HTML",
              },
            );

            continue;
          } catch (error) {
            console.error("[Payment Base64 Error]", error);
          }
        }

        // --------------------------------------
        // REMOTE IMAGE
        // --------------------------------------

        if (payment.imageUrl && !payment.imageUrl.startsWith("data:")) {
          try {
            await ctx.replyWithPhoto(
              {
                url: payment.imageUrl,
              },
              {
                caption,
                parse_mode: "HTML",
              },
            );

            continue;
          } catch (error) {
            console.error("[Payment Image URL Error]", error);
          }
        }

        // --------------------------------------
        // TEXT FALLBACK
        // --------------------------------------

        await ctx.reply(caption, {
          parse_mode: "HTML",
        });
      }
    } catch (error) {
      console.error("[Payment Error]", error);

      await ctx.reply(
        "Maaf Kak, metode pembayaran sedang gagal dimuat. Coba lagi sebentar ya 🙏",
      );
    }
  }

  // ========================================================
  // PAYMENT PROOF
  // ========================================================

  async function handleProof(ctx: Context, fileId: string, caption: string) {
    try {
      const from = ctx.from;

      if (!from) {
        return;
      }

      const productList = await getProductsWithStock();

      if (productList.length === 0) {
        await ctx.reply("Belum ada produk yang tersedia Kak.");

        return;
      }

      // --------------------------------------
      // PRODUCT
      // --------------------------------------

      const matchedProduct = findProduct(caption, productList);

      const selectedProduct =
        matchedProduct ??
        (productList.length === 1 ? productList[0] : undefined);

      if (!selectedProduct) {
        const names = productList
          .map((product) => `• ${escapeHtml(product.name)}`)
          .join("\n");

        await ctx.reply(
          [
            "⚠️ <b>Belum tahu bukti ini untuk produk apa.</b>",
            "",
            "Kirim ulang gambar dengan caption nama produk dan jumlah.",
            "",
            "Contoh:",
            "<code>Canva 2</code>",
            "",
            "<b>Produk:</b>",
            names,
          ].join("\n"),
          {
            parse_mode: "HTML",
          },
        );

        return;
      }

      // --------------------------------------
      // QUANTITY
      // --------------------------------------

      const quantity = Math.max(1, parseQuantity(caption));

      // --------------------------------------
      // STOCK
      // --------------------------------------

      if (selectedProduct.stock < quantity) {
        await ctx.reply(
          [
            "❌ <b>Stok tidak mencukupi.</b>",
            "",
            `Produk: <b>${escapeHtml(selectedProduct.name)}</b>`,
            `Diminta: ${quantity}`,
            `Tersedia: ${selectedProduct.stock}`,
          ].join("\n"),
          {
            parse_mode: "HTML",
          },
        );

        return;
      }

      // --------------------------------------
      // PENDING LIMIT
      // --------------------------------------

      const pendingOrders = await db
        .select({
          id: orders.id,
        })
        .from(orders)
        .where(
          and(
            eq(orders.telegramId, from.id),

            eq(orders.status, "PENDING"),
          ),
        );

      if (pendingOrders.length >= MAX_PENDING_ORDERS) {
        await ctx.reply(
          `Kak masih punya ${MAX_PENDING_ORDERS} order yang menunggu verifikasi. Tunggu Admin memprosesnya dulu ya 🙏`,
        );

        return;
      }

      // --------------------------------------
      // CREATE ORDER
      // --------------------------------------

      const [order] = await db
        .insert(orders)
        .values({
          telegramId: from.id,

          telegramUsername: from.username ?? from.first_name,

          productId: selectedProduct.id,

          quantity,

          proofFileId: fileId,

          status: "PENDING",
        })
        .returning({
          id: orders.id,
        });

      const total = selectedProduct.price * quantity;

      await ctx.reply(
        [
          "✅ <b>Bukti pembayaran diterima!</b>",
          "",
          `Order: <b>#${order.id}</b>`,
          `Produk: <b>${escapeHtml(selectedProduct.name)}</b>`,
          `Jumlah: <b>${quantity}</b>`,
          `Total: <b>Rp ${formatRupiah(total)}</b>`,
          "",
          "Pesanan sedang menunggu verifikasi Admin.",
          "",
          "Setelah disetujui, data akun akan dikirim otomatis ke chat ini. 🙏",
        ].join("\n"),
        {
          parse_mode: "HTML",
        },
      );

      // --------------------------------------
      // MEMORY
      // --------------------------------------

      await saveChatMessage(
        from.id,
        "user",
        `[Customer mengirim bukti pembayaran untuk ${selectedProduct.name}, jumlah ${quantity}, order #${order.id}]`,
      );

      await saveChatMessage(
        from.id,
        "assistant",
        `Bukti pembayaran order #${order.id} diterima dan sedang menunggu verifikasi Admin.`,
      );
    } catch (error) {
      console.error("[Proof Error]", error);

      await ctx.reply(
        "Maaf Kak, bukti pembayaran gagal diproses. Coba kirim ulang ya 🙏",
      );
    }
  }

  // ========================================================
  // /START
  // ========================================================

  bot.start(async (ctx) => {
    if (!isPrivate(ctx)) {
      return;
    }

    await ctx.reply(
      [
        "👋 <b>Selamat datang di SN Store!</b>",
        "",
        "Aku asisten virtual SN Store.",
        "Kak bisa langsung chat seperti biasa 😄",
        "",
        "Contoh:",
        '• "Ada produk apa aja?"',
        '• "AM masih ada?"',
        '• "Kalau ambil 2 berapa?"',
        '• "Mau lihat payment"',
        "",
        "Shortcut:",
        "📦 /katalog",
        "💳 /payment",
      ].join("\n"),
      {
        parse_mode: "HTML",
      },
    );
  });

  // ========================================================
  // /KATALOG
  // ========================================================

  bot.command("katalog", async (ctx) => {
    if (!isPrivate(ctx)) {
      return;
    }

    await sendCatalog(ctx);
  });

  // ========================================================
  // /PAYMENT
  // ========================================================

  bot.command("payment", async (ctx) => {
    if (!isPrivate(ctx)) {
      return;
    }

    await sendPayments(ctx);
  });

  // ========================================================
  // PHOTO PROOF
  // ========================================================

  bot.on("photo", async (ctx) => {
    if (!isPrivate(ctx)) {
      return;
    }

    const photos = ctx.message.photo;

    if (photos.length === 0) {
      return;
    }

    const photo = photos[photos.length - 1];

    await handleProof(ctx, photo.file_id, ctx.message.caption ?? "");
  });

  // ========================================================
  // DOCUMENT PROOF
  // ========================================================

  bot.on("document", async (ctx) => {
    if (!isPrivate(ctx)) {
      return;
    }

    const document = ctx.message.document;

    if (!document.mime_type || !IMAGE_MIME_TYPES.includes(document.mime_type)) {
      await ctx.reply(
        [
          "Bukti pembayaran harus berupa gambar ya Kak.",
          "",
          "Format:",
          "• JPG / JPEG",
          "• PNG",
          "• WebP",
        ].join("\n"),
      );

      return;
    }

    await handleProof(ctx, document.file_id, ctx.message.caption ?? "");
  });

  // ========================================================
  // TEXT
  // ========================================================

  bot.on("text", async (ctx) => {
    if (!isPrivate(ctx)) {
      return;
    }

    const message = ctx.message.text.trim();

    if (!message) {
      return;
    }

    const telegramId = ctx.from.id;

    try {
      // ==================================================
      // CUSTOM / UNKNOWN COMMAND
      // ==================================================

      if (message.startsWith("/")) {
        const match = message.match(/^\/([a-zA-Z0-9_]+)(?:@\w+)?/);

        const command = match?.[1]?.toLowerCase() ?? "";

        if (command && !RESERVED_COMMANDS.includes(command)) {
          const [custom] = await db
            .select()
            .from(botCommands)
            .where(eq(botCommands.command, command))
            .limit(1);

          if (custom) {
            await ctx.reply(
              [
                `📌 <b>${escapeHtml(custom.title)}</b>`,
                "",
                escapeHtml(custom.responseMessage),
              ].join("\n"),
              {
                parse_mode: "HTML",
              },
            );

            return;
          }

          // Command tidak dikenal tetap boleh
          // dipahami AI sebagai percakapan.
        }
      }

      // ==================================================
      // HISTORY
      // ==================================================

      const history = await getChatHistory(telegramId);

      // ==================================================
      // REALTIME DATABASE CONTEXT
      // ==================================================

      const [productList, paymentList] = await Promise.all([
        getProductsWithStock(),

        db
          .select({
            name: payments.name,

            accountName: payments.accountName,

            accountNumber: payments.accountNumber,
          })
          .from(payments)
          .where(eq(payments.isActive, true)),
      ]);

      // ==================================================
      // SAVE USER MESSAGE
      // ==================================================

      await saveChatMessage(telegramId, "user", message);

      await sendTyping(ctx);

      // ==================================================
      // AI-FIRST
      // ==================================================

      const aiReply = await askCustomerService({
        message,

        products: productList.map((product) => ({
          name: product.name,

          price: product.price,

          stock: product.stock,
        })),

        payments: paymentList,

        history,
      });

      // ==================================================
      // CLEAN AI RESPONSE
      // ==================================================

      if (aiReply) {
        await saveChatMessage(telegramId, "assistant", aiReply);

        await ctx.reply(aiReply);

        return;
      }

      // ==================================================
      // AI FAILED TWICE
      //
      // Tidak mencoba menjawab secara hardcode.
      // Tidak mengirim raw AI.
      // ==================================================

      const fallback =
        "Maaf Kak, tadi aku gagal memproses pesannya 😅 Coba kirim sekali lagi ya.";

      await saveChatMessage(telegramId, "assistant", fallback);

      await ctx.reply(fallback);
    } catch (error) {
      console.error("[Text Handler Error]", error);

      const fallback =
        "Maaf Kak, lagi ada kendala sementara 😅 Coba kirim pesannya sekali lagi ya.";

      try {
        await ctx.reply(fallback);
      } catch {
        // Ignore secondary Telegram error.
      }
    }
  });

  // ========================================================
  // GLOBAL ERROR HANDLER
  // ========================================================

  bot.catch(async (error, ctx) => {
    console.error(`[Telegram Bot Error] ${ctx.updateType}`, error);

    try {
      await ctx.reply(
        "Maaf Kak, lagi ada kendala sementara. Coba lagi sebentar ya 🙏",
      );
    } catch {
      // Ignore secondary error.
    }
  });

  return bot;
}
