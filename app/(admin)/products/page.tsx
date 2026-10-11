import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Boxes, PackageOpen, Plus } from "lucide-react";

import { db } from "@/db";
import { products, stocks } from "@/db/schema";

import ProductCard from "./product-card";
import ProductForm from "./product-form";

export const metadata: Metadata = {
  title: "Products",
};

export default async function ProductsPage() {
  const [productList, stockList] = await Promise.all([
    db.select().from(products).orderBy(asc(products.name)),

    db
      .select({
        id: stocks.id,
        productId: stocks.productId,
        accountData: stocks.accountData,
        isSold: stocks.isSold,
      })
      .from(stocks)
      .where(eq(stocks.isSold, false))
      .orderBy(asc(stocks.id)),
  ]);

  const data = productList.map((product) => ({
    ...product,

    stocks: stockList.filter((stock) => stock.productId === product.id),
  }));

  return (
    <div className="space-y-7">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Inventory
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Products
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Kelola produk dan stok akun.
          </p>
        </div>

        <ProductForm
          trigger={
            <span className="flex size-11 items-center justify-center rounded-xl bg-white text-black sm:size-auto sm:h-11 sm:gap-2 sm:px-4">
              <Plus size={18} />

              <span className="hidden text-sm font-medium sm:inline">
                Product
              </span>
            </span>
          }
        />
      </section>

      {data.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <Boxes size={30} className="mx-auto text-zinc-700" />

          <h2 className="mt-4 text-sm font-medium text-zinc-300">
            Belum ada produk
          </h2>

          <p className="mt-1 text-xs text-zinc-600">
            Tambahkan produk pertama Anda.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <PackageOpen size={14} />
        Total {productList.length} produk
      </div>
    </div>
  );
}
