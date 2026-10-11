"use client";

import { ChangeEvent, ReactNode, useRef, useState } from "react";

import {
  CreditCard,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { createPayment, updatePayment } from "./actions";

type Payment = {
  id: number;
  name: string;
  accountName: string | null;
  accountNumber: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

type Props = {
  payment?: Payment;
  trigger: ReactNode;
};

export default function PaymentForm({ payment, trigger }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  const [preview, setPreview] = useState<string | null>(
    payment?.imageUrl ?? null,
  );

  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  function open() {
    setPreview(payment?.imageUrl ?? null);

    setRemoveExistingImage(false);

    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Format gambar harus JPG, PNG, atau WebP.");

      event.target.value = "";

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2 MB.");

      event.target.value = "";

      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    const url = URL.createObjectURL(file);

    setPreview(url);

    setRemoveExistingImage(false);
  }

  function removeImage() {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);

    setRemoveExistingImage(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    try {
      if (payment) {
        formData.set("id", String(payment.id));

        formData.set("removeImage", String(removeExistingImage));

        await updatePayment(formData);
      } else {
        await createPayment(formData);
      }

      close();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Gagal menyimpan payment.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={open}>
        {trigger}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900 p-0 text-white backdrop:bg-black/70"
      >
        <form action={handleSubmit}>
          {/* Header */}

          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-900 px-5 py-4">
            <div>
              <h2 className="font-semibold">
                {payment ? "Edit Payment" : "New Payment"}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {payment
                  ? "Perbarui metode pembayaran."
                  : "Tambahkan metode pembayaran."}
              </p>
            </div>

            <button
              type="button"
              onClick={close}
              className="flex size-9 items-center justify-center rounded-xl text-zinc-500 active:bg-white/5"
            >
              <X size={18} />
            </button>
          </header>

          <div className="space-y-5 p-5">
            {/* Name */}

            <Input
              name="name"
              label="Payment name"
              placeholder="DANA / BCA / QRIS"
              defaultValue={payment?.name}
              required
            />

            {/* Account name */}

            <Input
              name="accountName"
              label="Account holder"
              placeholder="Ria Royadi"
              defaultValue={payment?.accountName ?? ""}
            />

            {/* Account number */}

            <Input
              name="accountNumber"
              label="Account/Phone number"
              placeholder="111111111"
              defaultValue={payment?.accountNumber ?? ""}
            />

            {/* Image */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400">
                  QR / Payment Image
                </label>

                <span className="text-[10px] text-zinc-600">
                  JPG, PNG, WebP · Max 2 MB
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              {preview ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                  <div className="relative aspect-square w-full bg-white">
                    {/* QR image sengaja pakai img
                        karena bisa berupa blob/data URL */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Payment QR"
                      className="h-full w-full object-contain p-4"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-xl bg-black/80 text-white backdrop-blur"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-12 w-full items-center justify-center gap-2 border-t border-white/10 text-xs font-medium text-zinc-300"
                  >
                    <Upload size={16} />
                    Ganti Gambar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950 px-6 text-center transition active:bg-zinc-900"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
                    <ImagePlus size={20} />
                  </div>

                  <p className="mt-3 text-sm font-medium text-zinc-300">
                    Upload gambar
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Tekan untuk memilih QRIS atau gambar pembayaran
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}

          <footer className="sticky bottom-0 flex gap-3 border-t border-white/10 bg-zinc-900 p-5">
            <button
              type="button"
              onClick={close}
              className="h-11 flex-1 rounded-xl border border-white/10 text-sm text-zinc-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <CreditCard size={17} />
              )}

              {payment ? "Save" : "Create"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </span>

      <input
        {...props}
        className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-600 sm:text-sm"
      />
    </label>
  );
}
