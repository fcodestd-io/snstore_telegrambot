import { NextResponse } from "next/server";
import type { Update } from "telegraf/types";

import { getBot } from "@/lib/bot-cache";

// ==========================================================
// POST /api/webhook
// ==========================================================

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const token = process.env.TELEGRAM_BOT_TOKEN;

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  // ========================================================
  // ENV VALIDATION
  // ========================================================

  if (!secret || !token || !openRouterApiKey) {
    console.error("[Webhook] Environment variable belum lengkap.");

    return NextResponse.json(
      {
        ok: false,
        error: "Server configuration error",
      },
      {
        status: 503,
      },
    );
  }

  // ========================================================
  // VERIFY TELEGRAM SECRET
  // ========================================================

  const telegramSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (telegramSecret !== secret) {
    console.warn("[Webhook] Invalid Telegram secret.");

    return NextResponse.json(
      {
        ok: false,
        error: "Forbidden",
      },
      {
        status: 403,
      },
    );
  }

  // ========================================================
  // PARSE TELEGRAM UPDATE
  // ========================================================

  let update: Update;

  try {
    update = (await request.json()) as Update;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body",
      },
      {
        status: 400,
      },
    );
  }

  // ========================================================
  // PROCESS UPDATE
  // ========================================================

  try {
    const bot = getBot(token, openRouterApiKey);

    await bot.handleUpdate(update);
  } catch (error) {
    console.error("[Webhook Error]", error);

    /*
     * Tetap balas 200 agar error internal bot
     * tidak menyebabkan Telegram terus
     * mengirim update yang sama.
     */
  }

  return NextResponse.json({
    ok: true,
  });
}
