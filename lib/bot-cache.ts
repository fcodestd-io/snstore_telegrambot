import type { Telegraf } from "telegraf";

import { setupBot } from "@/lib/bot";
import { getChatHistory, saveChatMessage } from "@/lib/chat-history";

import { createCustomerService } from "@/lib/ai/customer-service";

let botInstance: Telegraf | null = null;

export function getBot() {
  if (botInstance) {
    return botInstance;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum tersedia.");
  }

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY belum tersedia.");
  }

  botInstance = setupBot(token, apiKey);

  return botInstance;
}
