import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),

  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),

  OPENROUTER_API_KEY: z.string().min(1),

  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,

  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,

  SESSION_SECRET: process.env.SESSION_SECRET,
});
