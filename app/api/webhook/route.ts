import { NextResponse } from "next/server";

import { getBot } from "@/lib/bot-cache";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const token = process.env.TELEGRAM_BOT_TOKEN;

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  // -----------------------------------
  // Environment validation
  // -----------------------------------

  if (!secret) {
    console.error("[Webhook] TELEGRAM_WEBHOOK_SECRET belum dikonfigurasi.");

    return new NextResponse("Webhook secret belum dikonfigurasi", {
      status: 503,
    });
  }

  if (!token) {
    console.error("[Webhook] TELEGRAM_BOT_TOKEN belum dikonfigurasi.");

    return new NextResponse("Telegram token belum dikonfigurasi", {
      status: 503,
    });
  }

  if (!openRouterApiKey) {
    console.error("[Webhook] OPENROUTER_API_KEY belum dikonfigurasi.");

    return new NextResponse("OpenRouter API key belum dikonfigurasi", {
      status: 503,
    });
  }

  // -----------------------------------
  // Verifikasi request Telegram
  // -----------------------------------

  const telegramSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (telegramSecret !== secret) {
    return new NextResponse("Forbidden", {
      status: 403,
    });
  }

  // -----------------------------------
  // Process update
  // -----------------------------------

  try {
    const update = await request.json();

    const bot = getBot(token, openRouterApiKey);

    await bot.handleUpdate(update);
  } catch (error) {
    console.error("[Webhook Error]", error);

    // Sengaja tetap 200.
    //
    // Kalau kita return 500,
    // Telegram akan mengirim update
    // yang sama berulang kali.
  }

  return NextResponse.json({
    ok: true,
  });
}
