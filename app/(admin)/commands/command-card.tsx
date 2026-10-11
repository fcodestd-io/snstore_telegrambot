"use client";

import { Edit3, Trash2 } from "lucide-react";

import { deleteCommand } from "./actions";
import CommandForm from "./command-form";

type Command = {
  id: number;
  command: string;
  title: string;
  responseMessage: string;
};

export default function CommandCard({ command }: { command: Command }) {
  async function remove() {
    if (!confirm(`Hapus command /${command.command}?`)) {
      return;
    }

    const data = new FormData();

    data.set("id", String(command.id));

    await deleteCommand(data);
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <code className="text-sm font-semibold text-white">
            /{command.command}
          </code>

          <p className="mt-1 truncate text-xs text-zinc-500">{command.title}</p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-zinc-500">
          CUSTOM
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-950 p-4">
        <p className="line-clamp-4 whitespace-pre-line text-xs leading-5 text-zinc-500">
          {command.responseMessage}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <CommandForm
          command={command}
          trigger={
            <span className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs text-zinc-300">
              <Edit3 size={15} />
              Edit
            </span>
          }
        />

        <button
          type="button"
          onClick={remove}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/10 text-xs text-red-400"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </article>
  );
}
