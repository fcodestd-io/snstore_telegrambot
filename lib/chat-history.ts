import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { chatMessages } from "@/db/schema";

export async function getChatHistory(telegramId: number) {
  const messages = await db
    .select({
      role: chatMessages.role,

      content: chatMessages.content,
    })
    .from(chatMessages)
    .where(eq(chatMessages.telegramId, telegramId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(8);

  return messages.reverse().map((message) => ({
    role:
      message.role === "assistant" ? ("assistant" as const) : ("user" as const),

    content: message.content,
  }));
}

export async function saveChatMessage(
  telegramId: number,
  role: "user" | "assistant",
  content: string,
) {
  await db.insert(chatMessages).values({
    telegramId,
    role,
    content,
  });
}
