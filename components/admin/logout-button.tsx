"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      title="Logout"
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 transition active:scale-95 active:bg-zinc-800 lg:hover:bg-zinc-800 lg:hover:text-white"
    >
      {loading ? (
        <LoaderCircle size={18} className="animate-spin" />
      ) : (
        <LogOut size={18} />
      )}
    </button>
  );
}
