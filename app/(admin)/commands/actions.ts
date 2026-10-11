"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { botCommands } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const RESERVED = ["start", "katalog", "payment"];

function normalizeCommand(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/[^a-z0-9_]/g, "");
}

export async function createCommand(formData: FormData) {
  await requireAdmin();

  const command = normalizeCommand(String(formData.get("command") ?? ""));

  const title = String(formData.get("title") ?? "").trim();

  const responseMessage = String(formData.get("responseMessage") ?? "").trim();

  if (!command || !title || !responseMessage) {
    throw new Error("Semua field wajib diisi.");
  }

  if (RESERVED.includes(command)) {
    throw new Error(`/${command} merupakan command bawaan bot.`);
  }

  try {
    await db.insert(botCommands).values({
      command,
      title,
      responseMessage,
    });
  } catch {
    throw new Error(`Command /${command} sudah digunakan.`);
  }

  revalidatePath("/commands");
}

export async function updateCommand(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));

  const command = normalizeCommand(String(formData.get("command") ?? ""));

  const title = String(formData.get("title") ?? "").trim();

  const responseMessage = String(formData.get("responseMessage") ?? "").trim();

  if (!Number.isInteger(id) || !command || !title || !responseMessage) {
    throw new Error("Data command tidak valid.");
  }

  if (RESERVED.includes(command)) {
    throw new Error(`/${command} merupakan command bawaan bot.`);
  }

  try {
    await db
      .update(botCommands)
      .set({
        command,
        title,
        responseMessage,
      })
      .where(eq(botCommands.id, id));
  } catch {
    throw new Error(`Command /${command} sudah digunakan.`);
  }

  revalidatePath("/commands");
}

export async function deleteCommand(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    throw new Error("Command tidak valid.");
  }

  await db.delete(botCommands).where(eq(botCommands.id, id));

  revalidatePath("/commands");
}
