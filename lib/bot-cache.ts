import type { Telegraf } from "telegraf";

import { setupBot } from "@/lib/bot";

// ==========================================================
// GLOBAL BOT CACHE TYPE
// ==========================================================

type GlobalBotCache = typeof globalThis & {
  __telegramBot?: Telegraf;
  __telegramBotToken?: string;
  __telegramOpenRouterKey?: string;
};

// ==========================================================
// GLOBAL CACHE
// ==========================================================

const globalForBot = globalThis as GlobalBotCache;

// ==========================================================
// GET BOT
// ==========================================================

/**
 * Mengambil instance Telegram bot.
 *
 * Instance disimpan di globalThis agar tidak membuat
 * Telegraf instance baru pada setiap request webhook
 * selama server instance yang sama masih hidup.
 */
export function getBot(token: string, openRouterApiKey: string): Telegraf {
  // --------------------------------------------------------
  // RETURN CACHED BOT
  // --------------------------------------------------------

  if (
    globalForBot.__telegramBot &&
    globalForBot.__telegramBotToken === token &&
    globalForBot.__telegramOpenRouterKey === openRouterApiKey
  ) {
    return globalForBot.__telegramBot;
  }

  // --------------------------------------------------------
  // CREATE BOT
  // --------------------------------------------------------

  const bot = setupBot(token, openRouterApiKey);

  // --------------------------------------------------------
  // SAVE CACHE
  // --------------------------------------------------------

  globalForBot.__telegramBot = bot;

  globalForBot.__telegramBotToken = token;

  globalForBot.__telegramOpenRouterKey = openRouterApiKey;

  return bot;
}

// ==========================================================
// CLEAR BOT CACHE
// ==========================================================

/**
 * Berguna saat development/testing.
 *
 * Production normalnya tidak perlu memanggil fungsi ini.
 */
export function clearBotCache() {
  globalForBot.__telegramBot = undefined;

  globalForBot.__telegramBotToken = undefined;

  globalForBot.__telegramOpenRouterKey = undefined;
}
