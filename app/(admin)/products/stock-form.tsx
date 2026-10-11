"use client";

import { ReactNode, useRef, useState } from "react";
import { Boxes, LoaderCircle, X } from "lucide-react";

import { addStock } from "./actions";

type Props = {
  product: {
    id: number;
    name: string;
  };

  trigger: ReactNode;
};

export default function StockForm({ product, trigger }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState("");

  const count = accounts
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean).length;

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    try {
      formData.set("productId", String(product.id));

      await addStock(formData);

      setAccounts("");
      dialogRef.current?.close();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Gagal menambahkan stock.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-0 text-white backdrop:bg-black/70"
      >
        <form action={handleSubmit}>
          <header className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h2 className="font-semibold">Add Stock</h2>

              <p className="mt-1 text-xs text-zinc-500">{product.name}</p>
            </div>

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex size-9 items-center justify-center rounded-xl text-zinc-500"
            >
              <X size={18} />
            </button>
          </header>

          <div className="p-5">
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Account Data
            </label>

            <textarea
              name="accounts"
              value={accounts}
              onChange={(event) => setAccounts(event.target.value)}
              rows={10}
              required
              spellCheck={false}
              placeholder={`email1@gmail.com|password\nemail2@gmail.com|password\nemail3@gmail.com|password`}
              className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950 p-4 font-mono text-base leading-6 text-zinc-300 outline-none focus:border-zinc-600 sm:text-xs"
            />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-zinc-600">Satu baris = satu akun</p>

              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-400">
                {count} akun
              </span>
            </div>
          </div>

          <footer className="flex gap-3 border-t border-white/10 p-5">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-11 flex-1 rounded-xl border border-white/10 text-sm text-zinc-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || count === 0}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Boxes size={17} />
              )}
              Add {count || ""} Stock
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
