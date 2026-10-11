"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bot,
  Boxes,
  CreditCard,
  LayoutDashboard,
  PackageCheck,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: PackageCheck,
  },
  {
    name: "Products",
    href: "/products",
    icon: Boxes,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    name: "Commands",
    href: "/commands",
    icon: Bot,
  },
];

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-zinc-950 lg:block">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-black">
            SN
          </div>

          <div>
            <p className="text-sm font-semibold text-white">SN Store</p>

            <p className="text-xs text-zinc-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="space-y-1 p-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <Icon size={18} />

              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
        <p className="text-xs text-zinc-600">SN Store Bot</p>

        <p className="mt-1 text-xs text-zinc-700">Management System</p>
      </div>
    </aside>
  );
}
