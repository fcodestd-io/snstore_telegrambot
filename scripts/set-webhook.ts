import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;

const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN belum di-set.");

  process.exit(1);
}

async function telegramApi(method: string, body: unknown) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),
    },
  );

  return response.json();
}

// Hapus webhook
if (process.argv.includes("--delete")) {
  const result = await telegramApi("deleteWebhook", {
    drop_pending_updates: false,
  });

  console.log(result);
} else {
  // Ambil domain dari argument CLI.
  const baseUrl = process.argv.slice(2).find((arg) => arg.startsWith("http"));

  if (!baseUrl) {
    console.error("Domain belum diberikan.");

    console.error("Contoh: pnpm webhook:set https://project.vercel.app");

    process.exit(1);
  }

  if (!secret) {
    console.error("TELEGRAM_WEBHOOK_SECRET belum di-set.");

    process.exit(1);
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/webhook`;

  const result = await telegramApi("setWebhook", {
    url: webhookUrl,

    secret_token: secret,

    allowed_updates: ["message"],
  });

  console.log(result);

  console.log("Webhook:", webhookUrl);
}
