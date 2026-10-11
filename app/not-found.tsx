import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 text-center">
      <div>
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900">
          <SearchX size={24} className="text-zinc-400" />
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-zinc-600">
          404
        </p>

        <h1 className="mt-2 text-2xl font-semibold text-white">
          Halaman tidak ditemukan
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>

        <Link
          href="/dashboard"
          className="mx-auto mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>
      </div>
    </main>
  );
}
