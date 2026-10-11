"use client";

import { CircleCheck, CircleX, Edit3, ImageIcon, Trash2 } from "lucide-react";

import { deletePayment, togglePayment } from "./actions";

import PaymentForm from "./payment-form";

type Payment = {
  id: number;
  name: string;
  accountName: string | null;
  accountNumber: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

export default function PaymentCard({ payment }: { payment: Payment }) {
  async function toggle() {
    const data = new FormData();

    data.set("id", String(payment.id));

    data.set("active", String(payment.isActive));

    try {
      await togglePayment(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal mengubah status.");
    }
  }

  async function remove() {
    if (!confirm(`Hapus metode pembayaran "${payment.name}"?`)) {
      return;
    }

    const data = new FormData();

    data.set("id", String(payment.id));

    try {
      await deletePayment(data);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Gagal menghapus payment.",
      );
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
      {/* Image */}

      {payment.imageUrl ? (
        <div className="aspect-[16/10] border-b border-white/10 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={payment.imageUrl}
            alt={payment.name}
            className="h-full w-full object-contain p-4"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/7] items-center justify-center border-b border-white/10 bg-zinc-950">
          <div className="text-center">
            <ImageIcon size={24} className="mx-auto text-zinc-700" />

            <p className="mt-2 text-[10px] text-zinc-700">No payment image</p>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-white">
              {payment.name}
            </h2>

            <p className="mt-1 truncate text-xs text-zinc-500">
              {payment.accountName || "No account holder"}
            </p>
          </div>

          <span
            className={[
              "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium",
              payment.isActive
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-zinc-500",
            ].join(" ")}
          >
            {payment.isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>

        {/* Account */}

        {payment.accountNumber && (
          <div className="mt-4 rounded-xl border border-white/5 bg-zinc-950 px-4 py-3">
            <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">
              Account Number
            </p>

            <code className="mt-1.5 block truncate text-sm text-zinc-300">
              {payment.accountNumber}
            </code>
          </div>
        )}

        {/* Primary actions */}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <PaymentForm
            payment={payment}
            trigger={
              <span className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300">
                <Edit3 size={15} />
                Edit
              </span>
            }
          />

          <button
            type="button"
            onClick={toggle}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 active:bg-white/5"
          >
            {payment.isActive ? (
              <>
                <CircleX size={15} />
                Disable
              </>
            ) : (
              <>
                <CircleCheck size={15} />
                Enable
              </>
            )}
          </button>
        </div>

        {/* Delete */}

        <button
          type="button"
          onClick={remove}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/10 text-xs font-medium text-red-400 active:bg-red-500/10"
        >
          <Trash2 size={15} />
          Delete Payment
        </button>
      </div>
    </article>
  );
}
