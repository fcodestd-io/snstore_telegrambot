import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";

import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-sm font-bold text-black shadow-xl">
            SN
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Login untuk mengelola SN Store.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-zinc-700">
          SN Store Bot Management
        </p>
      </div>
    </main>
  );
}
