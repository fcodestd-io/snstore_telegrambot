import "dotenv/config";

import { setupBot } from "../lib/bot";

const token = process.env.TELEGRAM_BOT_TOKEN;

const apiKey = process.env.OPENROUTER_API_KEY;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN belum tersedia.");
}

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY belum tersedia.");
}

const bot = setupBot(token, apiKey);

async function start() {
  console.log("🤖 Memulai Telegram bot...");

  // Webhook dan long polling tidak boleh
  // aktif bersamaan pada bot yang sama.
  await bot.telegram.deleteWebhook({
    drop_pending_updates: true,
  });

  await bot.launch(
    {
      dropPendingUpdates: true,
    },
    () => {
      console.log("✅ Telegram bot berjalan dengan long polling.");

      console.log("📱 Silakan buka bot di Telegram dan kirim /start");
    },
  );
}

start().catch((error) => {
  console.error("❌ Bot gagal dijalankan:", error);

  process.exit(1);
});

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});
