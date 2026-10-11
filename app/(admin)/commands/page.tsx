import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Bot, Plus } from "lucide-react";

import { db } from "@/db";
import { botCommands } from "@/db/schema";

import CommandCard from "./command-card";
import CommandForm from "./command-form";

export const metadata: Metadata = {
  title: "Commands",
};

export default async function CommandsPage() {
  const commands = await db
    .select()
    .from(botCommands)
    .orderBy(asc(botCommands.command));

  return (
    <div className="space-y-7">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Telegram
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Commands
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Buat balasan command Telegram.
          </p>
        </div>

        <CommandForm
          trigger={
            <span className="flex size-11 items-center justify-center rounded-xl bg-white text-black sm:size-auto sm:h-11 sm:gap-2 sm:px-4">
              <Plus size={18} />

              <span className="hidden text-sm font-medium sm:inline">
                Command
              </span>
            </span>
          }
        />
      </section>

      {/* Built-in */}
      <section>
        <p className="mb-3 text-xs font-medium text-zinc-500">
          Built-in Commands
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <BuiltIn command="/start" description="Welcome message" />

          <BuiltIn command="/katalog" description="Product catalog" />

          <BuiltIn command="/payment" description="Payment methods" />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-medium text-zinc-500">
          Custom Commands
        </p>

        {commands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
            <Bot size={28} className="mx-auto text-zinc-700" />

            <p className="mt-3 text-sm text-zinc-500">
              Belum ada custom command.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {commands.map((command) => (
              <CommandCard key={command.id} command={command} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BuiltIn({
  command,
  description,
}: {
  command: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <code className="text-sm font-medium text-white">{command}</code>

        <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] text-zinc-500">
          SYSTEM
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-600">{description}</p>
    </div>
  );
}
