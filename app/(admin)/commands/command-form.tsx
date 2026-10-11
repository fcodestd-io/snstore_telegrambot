"use client";

import { ReactNode, useRef, useState } from "react";
import { Bot, LoaderCircle, X } from "lucide-react";

import { createCommand, updateCommand } from "./actions";

type Command = {
  id: number;
  command: string;
  title: string;
  responseMessage: string;
};

export default function CommandForm({
  command,
  trigger,
}: {
  command?: Command;
  trigger: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);

    try {
      if (command) {
        formData.set("id", String(command.id));

        await updateCommand(formData);
      } else {
        await createCommand(formData);
      }

      dialogRef.current?.close();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Gagal menyimpan command.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-0 text-white backdrop:bg-black/70"
      >
        <form action={submit}>
          <header className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h2 className="font-semibold">
                {command ? "Edit Command" : "New Command"}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Balasan otomatis Telegram.
              </p>
            </div>

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex size-9 items-center justify-center text-zinc-500"
            >
              <X size={18} />
            </button>
          </header>

          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Command</span>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                  /
                </span>

                <input
                  name="command"
                  defaultValue={command?.command}
                  placeholder="command"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 pl-8 pr-4 text-base text-white outline-none focus:border-zinc-600 sm:text-sm"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Title</span>

              <input
                name="title"
                defaultValue={command?.title}
                placeholder="Informasi"
                required
                className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none focus:border-zinc-600 sm:text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Response</span>

              <textarea
                name="responseMessage"
                defaultValue={command?.responseMessage}
                rows={8}
                placeholder="Masukkan pesan yang akan dikirim bot..."
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950 p-4 text-base leading-6 text-white outline-none focus:border-zinc-600 sm:text-sm"
              />
            </label>
          </div>

          <footer className="flex gap-3 border-t border-white/10 p-5">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-11 flex-1 rounded-xl border border-white/10 text-sm text-zinc-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Bot size={17} />
              )}
              Save
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
