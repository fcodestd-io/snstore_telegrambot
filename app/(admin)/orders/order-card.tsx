"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Send,
  X,
} from "lucide-react";

import { approveOrder, rejectOrder } from "./actions";

type Order = {
  id: number;

  telegramId: number;
  telegramUsername: string | null;

  quantity: number;
  status: string;

  proofFileId: string | null;
  sentAccountData: string | null;

  createdAt: Date;

  productName: string | null;
  productPrice: string | null;
};

export default function OrderCard({ order }: { order: Order }) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const price = Number(order.productPrice ?? 0);

  const total = price * order.quantity;

  const date = new Date(order.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function approve() {
    if (
      !confirm(
        `Approve order #${order.id}?\n\n${order.quantity} akun akan diambil dari stock dan langsung dikirim ke Telegram pembeli.`,
      )
    ) {
      return;
    }

    setAction("approve");

    try {
      const data = new FormData();

      data.set("id", String(order.id));

      await approveOrder(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal memproses order.");
    } finally {
      setAction(null);
    }
  }

  async function reject() {
    if (!confirm(`Tolak order #${order.id}?`)) {
      return;
    }

    setAction("reject");

    try {
      const data = new FormData();

      data.set("id", String(order.id));

      await rejectOrder(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menolak order.");
    } finally {
      setAction(null);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300">
            #{order.id}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {order.productName ?? "Unknown Product"}
            </h3>

            <p className="mt-1 truncate text-xs text-zinc-500">
              {order.telegramUsername
                ? `@${order.telegramUsername.replace(/^@/, "")}`
                : `Telegram ${order.telegramId}`}
            </p>
          </div>
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* Detail */}
      <div className="grid grid-cols-3 border-y border-white/5 bg-zinc-950/40">
        <Detail label="Quantity" value={`${order.quantity}`} />

        <Detail label="Price" value={`Rp ${price.toLocaleString("id-ID")}`} />

        <Detail label="Total" value={`Rp ${total.toLocaleString("id-ID")}`} />
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Clock3 size={13} />
          {date}
        </div>

        {/* Proof */}
        {order.proofFileId && (
          <a
            href={`/api/orders/proof/${order.id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-950 text-xs font-medium text-zinc-300 transition active:bg-zinc-800"
          >
            <ExternalLink size={15} />
            Lihat Bukti Pembayaran
          </a>
        )}

        {/* Pending Actions */}
        {order.status === "PENDING" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={reject}
              disabled={action !== null}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 text-xs font-medium text-red-400 disabled:opacity-50"
            >
              {action === "reject" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
              Reject
            </button>

            <button
              type="button"
              onClick={approve}
              disabled={action !== null}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-semibold text-black disabled:opacity-50"
            >
              {action === "approve" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Approve
            </button>
          </div>
        )}

        {/* Akun yang sudah dikirim */}
        {order.status === "SUCCESS" && order.sentAccountData && (
          <details className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400" />
                Account sent
              </span>

              <ChevronDown size={15} />
            </summary>

            <pre className="overflow-x-auto border-t border-white/10 bg-zinc-950 p-4 text-xs leading-6 text-zinc-400">
              {order.sentAccountData}
            </pre>
          </details>
        )}
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-3 text-center sm:px-4">
      <p className="truncate text-[9px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-zinc-300">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style: Record<string, string> = {
    PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-300",

    PROCESSING: "border-blue-500/20 bg-blue-500/10 text-blue-300",

    SUCCESS: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",

    REJECTED: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={[
        "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium",
        style[status] ?? "border-white/10 bg-white/5 text-zinc-400",
      ].join(" ")}
    >
      {status}
    </span>
  );
}
