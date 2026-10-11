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
  // GENERAL HELPERS
  // ========================================================

  function isPrivate(ctx: Context) {
    return ctx.chat?.type === "private";
  }

  async function sendTyping(ctx: Context) {
    try {
      await ctx.sendChatAction("typing");
    } catch {
      // Tidak penting jika gagal.
    }
  }

  // ========================================================
  // TEXT NORMALIZER
  // ========================================================

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[?!.,;:'"`~()[\]{}]/g, " ")
      .replace(/\s+/g, " ");
  }

  // ========================================================
  // PRODUCTS + STOCK
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
  // ========================================================

  function findProduct(message: string, productList: ProductWithStock[]) {
    const normalized = normalizeText(message);

    const words = normalized.split(" ");

    return [...productList]
      .sort((a, b) => b.name.length - a.name.length)
      .find((product) => {
        const productName = normalizeText(product.name);

        // Full name.
        if (normalized.includes(productName)) {
          return true;
        }

        // Alias kata pertama.
        //
        // AM Premium 1 Tahun
        // -> AM
        //
        // Canva Pro
        // -> Canva
        const firstWord = productName.split(" ")[0];

        if (firstWord.length >= 2 && words.includes(firstWord)) {
          return true;
        }

        return false;
      });
  }

  // ========================================================
  // HTML CHUNK
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

      await ctx.reply("Gagal mengambil katalog. Silakan coba lagi.");
    }
  }

  // ========================================================
  // PAYMENT
  // ========================================================

  async function sendPayments(ctx: Context) {
    try {
      await sendTyping(ctx);

      const paymentList = await db
        .select()
        .from(payments)
        .where(eq(payments.isActive, true));

      if (paymentList.length === 0) {
        await ctx.reply("Metode pembayaran belum tersedia.");

        return;
      }

      for (const payment of paymentList) {
        let caption = `💳 <b>${escapeHtml(payment.name)}</b>\n\n`;

        if (payment.accountNumber) {
          caption += `Nomor: <code>${escapeHtml(payment.accountNumber)}</code>\n`;
        }

        if (payment.accountName) {
          caption += `Atas nama: ${escapeHtml(payment.accountName)}\n`;
        }

        caption +=
          "\nSetelah transfer, kirim <b>gambar bukti pembayaran</b> ke chat ini.";

        caption += "\nTambahkan nama produk dan jumlah pada caption.";

        caption += "\nContoh: <code>Canva 2</code>";

        // --------------------------------------
        // BASE64
        // --------------------------------------

        if (payment.imageUrl?.startsWith("data:image")) {
          try {
            const base64 = payment.imageUrl.split(",")[1];

            if (!base64) {
              throw new Error("Invalid base64 payment image.");
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
            console.error("[Payment Base64 Image Error]", error);
          }
        }

        // --------------------------------------
        // URL
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
            console.error("[Payment URL Image Error]", error);
          }
        }

        // --------------------------------------
        // FALLBACK TEXT
        // --------------------------------------

        await ctx.reply(caption, {
          parse_mode: "HTML",
        });
      }
    } catch (error) {
      console.error("[Payment Error]", error);

      await ctx.reply("Gagal mengambil metode pembayaran.");
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
        await ctx.reply("Belum ada produk yang tersedia.");

        return;
      }

      // --------------------------------------
      // FIND PRODUCT
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
            "⚠️ <b>Saya belum tahu bukti ini untuk produk apa.</b>",
            "",
            "Kirim ulang gambar dengan caption nama produk dan jumlah.",
            "",
            "Contoh:",
            "<code>Canva 2</code>",
            "",
            "<b>Produk tersedia:</b>",
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
      // STOCK CHECK
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
          `Kak masih memiliki ${MAX_PENDING_ORDERS} pesanan yang menunggu verifikasi. Tunggu Admin memprosesnya terlebih dahulu ya 🙏`,
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
      // SAVE CONTEXT
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
      console.error("[Payment Proof Error]", error);

      await ctx.reply(
        "Gagal memproses bukti pembayaran. Silakan coba kirim ulang.",
      );
    }
  }

  // ========================================================
  // LOCAL PRODUCT FALLBACK
  // ========================================================

  async function localProductReply(ctx: Context, message: string) {
    const productList = await getProductsWithStock();

    const product = findProduct(message, productList);

    if (!product) {
      return null;
    }

    if (product.stock <= 0) {
      return `Maaf Kak, ${product.name} sedang habis 🙏`;
    }

    const normalized = normalizeText(message);

    const quantity = Math.max(1, parseQuantity(message));

    // Pertanyaan ketersediaan sederhana.
    const availabilityWords = [
      "ada",
      "ready",
      "tersedia",
      "masih",
      "msh",
      "stok",
      "stock",
    ];

    const asksAvailability = availabilityWords.some((word) =>
      normalized.split(" ").includes(word),
    );

    const asksPrice = ["harga", "hrg", "berapa", "brp"].some((word) =>
      normalized.split(" ").includes(word),
    );

    if (asksAvailability && !asksPrice && quantity === 1) {
      return `${product.name} masih ada Kak 👍 Stoknya ${product.stock} akun, harganya Rp ${formatRupiah(product.price)}.`;
    }

    if (quantity > product.stock) {
      return [
        `Stok ${product.name} saat ini hanya ${product.stock} akun Kak.`,
        `Harga per akun Rp ${formatRupiah(product.price)}.`,
      ].join("\n");
    }

    const total = product.price * quantity;

    if (asksPrice || quantity > 1) {
      return [
        `${quantity} ${product.name} totalnya Rp ${formatRupiah(total)} Kak 👍`,
        `Stok tersedia ${product.stock} akun.`,
      ].join("\n");
    }

    return [
      `${product.name} masih tersedia Kak 👍`,
      `Harganya Rp ${formatRupiah(product.price)} dan stoknya ${product.stock} akun.`,
    ].join("\n");
  }

  // ========================================================
  // LOCAL GENERIC FALLBACK
  // ========================================================

  function localGenericFallback(message: string) {
    const normalized = normalizeText(message);

    const greetings = [
      "halo",
      "hai",
      "hi",
      "hello",
      "p",
      "ping",
      "test",
      "tes",
      "cek",
    ];

    if (greetings.includes(normalized)) {
      return "Siap Kak, botnya aktif 👍 Ada produk yang mau ditanyakan?";
    }

    if (
      normalized.includes("makasih") ||
      normalized.includes("terima kasih") ||
      normalized === "thanks" ||
      normalized === "thank you"
    ) {
      return "Sama-sama Kak 🙏";
    }

    if (
      normalized.includes("kamu siapa") ||
      normalized.includes("siapa kamu")
    ) {
      return "Aku asisten virtual SN Store, Kak 😄 Ada produk yang mau ditanyakan?";
    }

    if (
      normalized.includes("model apa") ||
      normalized.includes("pake model") ||
      normalized.includes("pakai model") ||
      normalized.includes("openrouter") ||
      normalized.includes("system prompt") ||
      normalized.includes("prompt kamu")
    ) {
      return "Aku asisten virtual SN Store, Kak 😄 Ada produk yang mau ditanyakan?";
    }

    return "Maaf Kak, maksudnya yang mana ya? Kasih sedikit konteks biar aku bantu.";
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
        "Kak bisa langsung chat seperti biasa.",
        "",
        "Contoh:",
        '• "AM masih ada?"',
        '• "Kalau ambil 3 berapa?"',
        '• "Ada produk apa aja?"',
        '• "Mau bayar pakai QRIS"',
        "",
        "Menu cepat:",
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
  // PHOTO
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
  // DOCUMENT IMAGE
  // ========================================================

  bot.on("document", async (ctx) => {
    if (!isPrivate(ctx)) {
      return;
    }

    const document = ctx.message.document;

    if (!document.mime_type || !IMAGE_MIME_TYPES.includes(document.mime_type)) {
      await ctx.reply(
        [
          "❌ Bukti pembayaran harus berupa gambar.",
          "",
          "Format yang didukung:",
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

    const lower = normalizeText(message);

    const telegramId = ctx.from.id;

    try {
      // ==================================================
      // CUSTOM COMMAND
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

          await ctx.reply(
            "Command tidak ditemukan Kak. Bisa langsung chat seperti biasa atau gunakan /katalog.",
          );

          return;
        }
      }

      // ==================================================
      // FAST CATALOG ROUTER
      // ==================================================

      const catalogKeywords = [
        "katalog",
        "list produk",
        "daftar produk",
        "produk apa",
        "produk apa aja",
        "ada apa aja",
        "jual apa",
        "ready apa",
      ];

      if (catalogKeywords.some((keyword) => lower.includes(keyword))) {
        await sendCatalog(ctx);

        return;
      }

      // ==================================================
      // FAST PAYMENT ROUTER
      // ==================================================

      const paymentKeywords = [
        "qris",
        "qr code",
        "rekening",
        "norek",
        "no rek",
        "nomor rekening",
        "cara bayar",
        "mau bayar",
        "bayarnya",
        "payment",
        "tf kemana",
        "tf kmn",
      ];

      if (paymentKeywords.some((keyword) => lower.includes(keyword))) {
        await sendPayments(ctx);

        return;
      }

      // ==================================================
      // GET HISTORY BEFORE SAVING CURRENT MESSAGE
      // ==================================================

      const history = await getChatHistory(telegramId);

      // ==================================================
      // REALTIME DATA
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
      // SAVE CURRENT USER MESSAGE
      // ==================================================

      await saveChatMessage(telegramId, "user", message);

      await sendTyping(ctx);

      // ==================================================
      // ASK AI
      // ==================================================

      let aiReply: string | null = null;

      try {
        aiReply = await askCustomerService({
          message,

          products: productList.map((product) => ({
            name: product.name,

            price: product.price,

            stock: product.stock,
          })),

          payments: paymentList,

          history,
        });
      } catch (error) {
        console.error("[AI Customer Service Error]", error);

        aiReply = null;
      }

      // ==================================================
      // AI RESPONSE
      //
      // HANYA output yang sudah lolos hard guard di
      // customer-service.ts bisa sampai ke sini.
      // ==================================================

      if (aiReply) {
        await saveChatMessage(telegramId, "assistant", aiReply);

        // Plain Telegram text.
        //
        // Jangan masukkan kembali ke formatter AI lain.
        await ctx.reply(aiReply);

        return;
      }

      // ==================================================
      // AI REJECTED / FAILED
      //
      // Jangan pernah gunakan raw AI response.
      // ==================================================

      console.warn(
        "[BOT] AI response gagal / diblokir. Menggunakan local fallback.",
      );

      // ==================================================
      // PRODUCT FALLBACK
      // ==================================================

      const productFallback = await localProductReply(ctx, message);

      if (productFallback) {
        await saveChatMessage(telegramId, "assistant", productFallback);

        await ctx.reply(productFallback);

        return;
      }

      // ==================================================
      // GENERIC FALLBACK
      // ==================================================

      const fallback = localGenericFallback(message);

      await saveChatMessage(telegramId, "assistant", fallback);

      await ctx.reply(fallback);
    } catch (error) {
      console.error("[Text Handler Error]", error);

      const fallback =
        "Maaf Kak, sedang ada kendala sementara. Coba kirim pesannya lagi ya 🙏";

      try {
        await ctx.reply(fallback);
      } catch {
        // Ignore secondary error.
      }
    }
  });

  // ========================================================
  // GLOBAL ERROR
  // ========================================================

  bot.catch(async (error, ctx) => {
    console.error(`[Telegram Bot Error] ${ctx.updateType}`, error);

    try {
      await ctx.reply(
        "Maaf Kak, sedang ada kendala sementara. Coba lagi sebentar ya 🙏",
      );
    } catch {
      // Ignore secondary Telegram error.
    }
  });

  return bot;
}
