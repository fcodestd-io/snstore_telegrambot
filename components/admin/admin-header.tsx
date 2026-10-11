import LogoutButton from "./logout-button";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-black lg:hidden">
            SN
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              SN Store
            </p>

            <p className="truncate text-xs text-zinc-500">
              Telegram Bot Management
            </p>
          </div>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
