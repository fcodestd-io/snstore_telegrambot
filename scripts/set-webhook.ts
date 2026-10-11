import "dotenv/config";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const baseUrl = process.argv[2];

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN tidak ditemukan di .env");
  }

  if (!secret) {
    throw new Error("TELEGRAM_WEBHOOK_SECRET tidak ditemukan di .env");
  }

  if (!baseUrl) {
    throw new Error(
      "URL production wajib diberikan.\n" +
        "Contoh: pnpm webhook:set https://snstore-telegrambot.vercel.app",
    );
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");

  const webhookUrl = `${cleanBaseUrl}/api/webhook`;

  console.log("====================================");
  console.log("SN STORE - TELEGRAM WEBHOOK");
  console.log("====================================");
  console.log(`URL: ${webhookUrl}`);
  console.log("");

  // ========================================================
  // SET WEBHOOK
  // ========================================================

  const response = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        url: webhookUrl,

        secret_token: secret,

        allowed_updates: ["message"],

        drop_pending_updates: true,
      }),
    },
  );

  const result = await response.json();

  console.log("Set webhook response:");
  console.dir(result, {
    depth: null,
  });

  if (!response.ok) {
    throw new Error("Telegram gagal memasang webhook.");
  }

  console.log("");
  console.log("Webhook berhasil dipasang.");
  console.log("");

  // ========================================================
  // CHECK WEBHOOK
  // ========================================================

  const infoResponse = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
  );

  const info = await infoResponse.json();

  console.log("Webhook info:");
  console.dir(info, {
    depth: null,
  });

  if (!infoResponse.ok) {
    throw new Error("Gagal mengambil webhook info.");
  }
}

main().catch((error) => {
  console.error("");
  console.error("Webhook setup gagal:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
