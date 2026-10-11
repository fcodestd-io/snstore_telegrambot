import type { ReactNode } from "react";

import AdminHeader from "@/components/admin/admin-header";
import DesktopSidebar from "@/components/admin/desktop-sidebar";
import MobileNav from "@/components/admin/mobile-nav";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <DesktopSidebar />

      <div className="min-h-dvh lg:pl-64">
        <AdminHeader />

        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-8 lg:pt-8">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
