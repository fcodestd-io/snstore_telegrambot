import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { CreditCard, Plus } from "lucide-react";

import { db } from "@/db";
import { payments } from "@/db/schema";

import PaymentCard from "./payment-card";
import PaymentForm from "./payment-form";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function PaymentsPage() {
  const data = await db.select().from(payments).orderBy(asc(payments.id));

  return (
    <div className="space-y-7">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Configuration
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Payments
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Metode pembayaran bot Telegram.
          </p>
        </div>
        <PaymentForm
          trigger={
            <span className="flex size-11 items-center justify-center rounded-xl bg-white text-black sm:size-auto sm:h-11 sm:gap-2 sm:px-4">
              <Plus size={18} />

              <span className="hidden text-sm font-medium sm:inline">
                Payment
              </span>
            </span>
          }
        />
      </section>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <CreditCard size={30} className="mx-auto text-zinc-700" />

          <p className="mt-4 text-sm text-zinc-400">
            Belum ada metode pembayaran.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </section>
      )}
    </div>
  );
}
