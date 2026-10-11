"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { products, stocks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !Number.isFinite(price) || price < 0) {
    throw new Error("Data produk tidak valid.");
  }

  await db.insert(products).values({
    name,
    price: price.toString(),
    description: description || null,
  });

  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();

  if (!Number.isInteger(id) || !name || !Number.isFinite(price) || price < 0) {
    throw new Error("Data produk tidak valid.");
  }

  await db
    .update(products)
    .set({
      name,
      price: price.toString(),
      description: description || null,
    })
    .where(eq(products.id, id));

  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    throw new Error("ID produk tidak valid.");
  }

  await db.delete(products).where(eq(products.id, id));

  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function addStock(formData: FormData) {
  await requireAdmin();

  const productId = Number(formData.get("productId"));
  const raw = String(formData.get("accounts") ?? "");

  if (!Number.isInteger(productId)) {
    throw new Error("Produk tidak valid.");
  }

  const accounts = raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (accounts.length === 0) {
    throw new Error("Masukkan minimal satu akun.");
  }

  await db.insert(stocks).values(
    accounts.map((accountData) => ({
      productId,
      accountData,
      isSold: false,
    })),
  );

  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function deleteStock(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    throw new Error("ID stock tidak valid.");
  }

  await db.delete(stocks).where(eq(stocks.id, id));

  revalidatePath("/products");
  revalidatePath("/dashboard");
}
