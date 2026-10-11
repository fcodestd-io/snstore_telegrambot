"use client";

import { ChevronDown, Edit3, PackagePlus, Trash2 } from "lucide-react";

import { deleteProduct, deleteStock } from "./actions";

import ProductForm from "./product-form";
import StockForm from "./stock-form";

type Product = {
  id: number;
  name: string;
  price: string;
  description: string | null;

  stocks: {
    id: number;
    productId: number;
    accountData: string;
    isSold: boolean;
  }[];
};

export default function ProductCard({ product }: { product: Product }) {
  const price = Number(product.price).toLocaleString("id-ID");

  async function handleDeleteProduct() {
    if (
      !confirm(`Hapus "${product.name}"?\n\nStock produk juga akan terhapus.`)
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("id", String(product.id));

    try {
      await deleteProduct(formData);
    } catch {
      alert(
        "Produk tidak bisa dihapus. Kemungkinan sudah memiliki riwayat order.",
      );
    }
  }

  async function handleDeleteStock(id: number) {
    if (!confirm("Hapus akun dari stock?")) return;

    const formData = new FormData();
    formData.set("id", String(id));

    await deleteStock(formData);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 font-semibold text-zinc-300">
            {product.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-white sm:text-base">
              {product.name}
            </h2>

            <p className="mt-1 text-lg font-semibold tracking-tight text-white">
              Rp {price}
            </p>
          </div>

          <span
            className={[
              "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium",
              product.stocks.length > 0
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300",
            ].join(" ")}
          >
            {product.stocks.length} stock
          </span>
        </div>

        {product.description && (
          <p className="mt-4 line-clamp-2 text-xs leading-5 text-zinc-500">
            {product.description}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <ProductForm
            product={product}
            trigger={
              <span className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs text-zinc-300">
                <Edit3 size={15} />
                Edit
              </span>
            }
          />

          <StockForm
            product={product}
            trigger={
              <span className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs text-zinc-300">
                <PackagePlus size={15} />
                Stock
              </span>
            }
          />

          <button
            type="button"
            onClick={handleDeleteProduct}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/10 text-xs text-red-400 active:bg-red-500/10"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {product.stocks.length > 0 && (
        <details className="border-t border-white/10">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs text-zinc-400 sm:px-5">
            <span>Available Accounts ({product.stocks.length})</span>

            <ChevronDown size={16} />
          </summary>

          <div className="max-h-72 divide-y divide-white/5 overflow-y-auto border-t border-white/5">
            {product.stocks.map((stock, index) => (
              <div
                key={stock.id}
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-[10px] text-zinc-500">
                  {index + 1}
                </span>

                <code className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                  {stock.accountData}
                </code>

                <button
                  type="button"
                  onClick={() => handleDeleteStock(stock.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 active:bg-red-500/10 active:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}
