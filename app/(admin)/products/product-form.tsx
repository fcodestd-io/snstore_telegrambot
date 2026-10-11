"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { LoaderCircle, PackagePlus, X } from "lucide-react";

import { createProduct, updateProduct } from "./actions";

type Product = {
  id: number;
  name: string;
  price: string;
  description: string | null;
};

type Props = {
  product?: Product;
  trigger: ReactNode;
};

export default function ProductForm({ product, trigger }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [loading, setLoading] = useState(false);

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const dialog = dialogRef.current;

    function handleClick(event: MouseEvent) {
      if (event.target === dialog) {
        dialog?.close();
      }
    }

    dialog?.addEventListener("click", handleClick);

    return () => {
      dialog?.removeEventListener("click", handleClick);
    };
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    try {
      if (product) {
        formData.set("id", String(product.id));
        await updateProduct(formData);
      } else {
        await createProduct(formData);
      }

      close();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan produk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={open}>
        {trigger}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-0 text-zinc-100 backdrop:bg-black/70"
      >
        <form action={handleSubmit}>
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-semibold text-white">
                {product ? "Edit Product" : "New Product"}
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500">
                {product
                  ? "Perbarui informasi produk."
                  : "Tambahkan produk ke katalog."}
              </p>
            </div>

            <button
              type="button"
              onClick={close}
              className="flex size-9 items-center justify-center rounded-xl text-zinc-500 active:bg-white/5"
            >
              <X size={18} />
            </button>
          </header>

          <div className="space-y-5 p-5">
            <div>
              <label
                htmlFor={`name-${product?.id ?? "new"}`}
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Product name
              </label>

              <input
                id={`name-${product?.id ?? "new"}`}
                name="name"
                defaultValue={product?.name}
                placeholder="Contoh: Canva Premium"
                required
                className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none focus:border-zinc-600 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor={`price-${product?.id ?? "new"}`}
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Price
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-600">
                  Rp
                </span>

                <input
                  id={`price-${product?.id ?? "new"}`}
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product ? Number(product.price) : undefined}
                  placeholder="25000"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 pl-11 pr-4 text-base text-white outline-none focus:border-zinc-600 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`description-${product?.id ?? "new"}`}
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Description
              </label>

              <textarea
                id={`description-${product?.id ?? "new"}`}
                name="description"
                defaultValue={product?.description ?? ""}
                rows={4}
                placeholder="Deskripsi singkat produk..."
                className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-base leading-6 text-white outline-none focus:border-zinc-600 sm:text-sm"
              />
            </div>
          </div>

          <footer className="flex gap-3 border-t border-white/10 p-5">
            <button
              type="button"
              onClick={close}
              className="h-11 flex-1 rounded-xl border border-white/10 text-sm text-zinc-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <PackagePlus size={17} />
              )}

              {product ? "Save" : "Create"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
