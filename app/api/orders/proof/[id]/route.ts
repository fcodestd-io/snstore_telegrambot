import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const session = await getAdminSession();

  if (!session) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  const { id } = await context.params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    return new NextResponse("Invalid order", {
      status: 400,
    });
  }

  const [order] = await db
    .select({
      proofFileId: orders.proofFileId,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order?.proofFileId) {
    return new NextResponse("Proof not found", {
      status: 404,
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return new NextResponse("Telegram configuration missing", {
      status: 500,
    });
  }

  try {
    // Ambil informasi file dari Telegram
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(
        order.proofFileId,
      )}`,
      {
        cache: "no-store",
      },
    );

    if (!fileInfoResponse.ok) {
      throw new Error("Gagal mengambil informasi file Telegram.");
    }

    const fileInfo = await fileInfoResponse.json();

    const filePath: string | undefined = fileInfo.result?.file_path;

    if (!filePath) {
      throw new Error("Telegram tidak memberikan file_path.");
    }

    // Download file asli
    const fileResponse = await fetch(
      `https://api.telegram.org/file/bot${token}/${filePath}`,
      {
        cache: "no-store",
      },
    );

    if (!fileResponse.ok) {
      throw new Error("Gagal mengambil bukti pembayaran.");
    }

    const buffer = await fileResponse.arrayBuffer();

    // Tentukan MIME dari extension Telegram.
    const contentType = getImageContentType(filePath);

    return new NextResponse(buffer, {
      status: 200,

      headers: {
        "Content-Type": contentType,

        // Paksa browser menampilkan sebagai gambar
        "Content-Disposition": `inline; filename="proof-${orderId}.${getExtension(
          contentType,
        )}"`,

        "Cache-Control": "private, no-store, max-age=0",

        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[Payment Proof Error]", error);

    return new NextResponse("Gagal mengambil bukti pembayaran.", {
      status: 502,
    });
  }
}

function getImageContentType(filePath: string) {
  const path = filePath.toLowerCase();

  if (path.endsWith(".png")) {
    return "image/png";
  }

  if (path.endsWith(".webp")) {
    return "image/webp";
  }

  if (path.endsWith(".gif")) {
    return "image/gif";
  }

  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  // Bukti pembayaran dari Telegram
  // biasanya JPEG jika dikirim sebagai photo.
  return "image/jpeg";
}

function getExtension(contentType: string) {
  switch (contentType) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/gif":
      return "gif";

    default:
      return "jpg";
  }
}
