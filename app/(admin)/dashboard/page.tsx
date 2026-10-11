import { count, desc, eq } from "drizzle-orm";
import { Boxes, CircleCheckBig, Clock3, PackageOpen } from "lucide-react";

import { db } from "@/db";
import { orders, products, stocks } from "@/db/schema";

export default async function DashboardPage() {
  const [productCount, stockCount, pendingCount, successCount, recentOrders] =
    await Promise.all([
      db
        .select({
          value: count(),
        })
        .from(products),

      db
        .select({
          value: count(),
        })
        .from(stocks)
        .where(eq(stocks.isSold, false)),

      db
        .select({
          value: count(),
        })
        .from(orders)
        .where(eq(orders.status, "PENDING")),

      db
        .select({
          value: count(),
        })
        .from(orders)
        .where(eq(orders.status, "SUCCESS")),

      db
        .select({
          id: orders.id,
          telegramUsername: orders.telegramUsername,
          quantity: orders.quantity,
          status: orders.status,
          createdAt: orders.createdAt,

          productName: products.name,
        })
        .from(orders)
        .leftJoin(products, eq(orders.productId, products.id))
        .orderBy(desc(orders.createdAt))
        .limit(5),
    ]);

  const stats = [
    {
      title: "Products",
      value: productCount[0]?.value ?? 0,
      description: "Total produk",
      icon: Boxes,
    },
    {
      title: "Available",
      value: stockCount[0]?.value ?? 0,
      description: "Stok tersedia",
      icon: PackageOpen,
    },
    {
      title: "Pending",
      value: pendingCount[0]?.value ?? 0,
      description: "Perlu diproses",
      icon: Clock3,
    },
    {
      title: "Success",
      value: successCount[0]?.value ?? 0,
      description: "Order selesai",
      icon: CircleCheckBig,
    },
  ];

  return (
    <div className="space-y-7">
      {/* Heading */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Overview
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Pantau toko dan pesanan terbaru.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="min-w-0 rounded-2xl border border-white/10 bg-zinc-900/50 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-zinc-500 sm:text-sm">
                  {stat.title}
                </p>

                <Icon size={17} className="shrink-0 text-zinc-500" />
              </div>

              <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {stat.value}
              </p>

              <p className="mt-1 truncate text-[11px] text-zinc-600 sm:text-xs">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Recent Orders */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-white">Recent Orders</h2>

          <p className="mt-0.5 text-xs text-zinc-500">5 pesanan terbaru</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
          {recentOrders.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <PackageOpen size={28} className="mx-auto text-zinc-700" />

              <p className="mt-3 text-sm text-zinc-500">Belum ada pesanan.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300">
                    #{order.id}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {order.productName ?? "Unknown Product"}
                      </p>

                      <StatusBadge status={order.status} />
                    </div>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {order.telegramUsername
                        ? `@${order.telegramUsername.replace(/^@/, "")}`
                        : "Telegram User"}
                      {" · "}
                      {order.quantity} akun
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-300",

    PROCESSING: "border-blue-500/20 bg-blue-500/10 text-blue-300",

    SUCCESS: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",

    REJECTED: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={[
        "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium",
        styles[status] ?? "border-white/10 bg-white/5 text-zinc-400",
      ].join(" ")}
    >
      {status}
    </span>
  );
}
