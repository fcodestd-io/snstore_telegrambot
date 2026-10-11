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
    name: "Home",
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
    name: "Payment",
    href: "/payments",
    icon: CreditCard,
  },
  {
    name: "Commands",
    href: "/commands",
    icon: Bot,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="grid h-16 grid-cols-5">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] transition active:bg-white/5",
                active ? "text-white" : "text-zinc-600",
              ].join(" ")}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-7 rounded-full bg-white" />
              )}

              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />

              <span className="max-w-full truncate px-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
