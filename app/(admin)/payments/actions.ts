"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function imageToDataUrl(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) {
    return null;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Format gambar harus JPG, PNG, atau WebP.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Ukuran gambar maksimal 2 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

// ==========================================
// CREATE
// ==========================================

export async function createPayment(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();

  const accountName = String(formData.get("accountName") ?? "").trim();

  const accountNumber = String(formData.get("accountNumber") ?? "").trim();

  const image = formData.get("image");

  if (!name) {
    throw new Error("Nama pembayaran wajib diisi.");
  }

  const imageUrl = image instanceof File ? await imageToDataUrl(image) : null;

  await db.insert(payments).values({
    name,

    accountName: accountName || null,

    accountNumber: accountNumber || null,

    imageUrl,

    isActive: true,
  });

  revalidatePath("/payments");
}

// ==========================================
// UPDATE
// ==========================================

export async function updatePayment(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));

  const name = String(formData.get("name") ?? "").trim();

  const accountName = String(formData.get("accountName") ?? "").trim();

  const accountNumber = String(formData.get("accountNumber") ?? "").trim();

  const removeImage = formData.get("removeImage") === "true";

  const image = formData.get("image");

  if (!Number.isInteger(id) || !name) {
    throw new Error("Data payment tidak valid.");
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);

  if (!payment) {
    throw new Error("Payment tidak ditemukan.");
  }

  let imageUrl = payment.imageUrl;

  if (removeImage) {
    imageUrl = null;
  }

  if (image instanceof File && image.size > 0) {
    imageUrl = await imageToDataUrl(image);
  }

  await db
    .update(payments)
    .set({
      name,

      accountName: accountName || null,

      accountNumber: accountNumber || null,

      imageUrl,
    })
    .where(eq(payments.id, id));

  revalidatePath("/payments");
}

// ==========================================
// ENABLE / DISABLE
// ==========================================

export async function togglePayment(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));

  const active = formData.get("active") === "true";

  if (!Number.isInteger(id)) {
    throw new Error("Payment tidak valid.");
  }

  await db
    .update(payments)
    .set({
      isActive: !active,
    })
    .where(eq(payments.id, id));

  revalidatePath("/payments");
}

// ==========================================
// DELETE
// ==========================================

export async function deletePayment(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    throw new Error("Payment tidak valid.");
  }

  await db.delete(payments).where(eq(payments.id, id));

  revalidatePath("/payments");
}
