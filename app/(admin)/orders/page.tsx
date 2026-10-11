import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { PackageOpen } from "lucide-react";

import { db } from "@/db";
import { orders, products } from "@/db/schema";

import OrderCard from "./order-card";

export const metadata: Metadata = {
  title: "Orders",
};


export default async function OrdersPage() {
  const data = await db
    .select({
      id: orders.id,

      telegramId: orders.telegramId,
      telegramUsername: orders.telegramUsername,

      quantity: orders.quantity,
      status: orders.status,

      proofFileId: orders.proofFileId,
      sentAccountData: orders.sentAccountData,

      createdAt: orders.createdAt,

      productName: products.name,
      productPrice: products.price,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .orderBy(desc(orders.createdAt));

  const pending = data.filter((order) => order.status === "PENDING");

  const history = data.filter((order) => order.status !== "PENDING");

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Transactions
        </p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Orders
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Verifikasi pembayaran dan kirim akun.
            </p>
          </div>

          {pending.length > 0 && (
            <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
              {pending.length} pending
            </span>
          )}
        </div>
      </section>

      {/* Pending */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white">Needs Review</h2>

          <p className="mt-1 text-xs text-zinc-600">
            Pembayaran yang menunggu verifikasi.
          </p>
        </div>

        {pending.length === 0 ? (
          <EmptyOrders text="Tidak ada order yang perlu diverifikasi." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {pending.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white">History</h2>

          <p className="mt-1 text-xs text-zinc-600">
            Order yang sudah diproses.
          </p>
        </div>

        {history.length === 0 ? (
          <EmptyOrders text="Belum ada riwayat order." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {history.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyOrders({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center">
      <PackageOpen size={28} className="mx-auto text-zinc-700" />

      <p className="mt-3 text-xs text-zinc-600">{text}</p>
    </div>
  );
}
