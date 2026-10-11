import { NextResponse } from "next/server";

import { COOKIE_NAME, createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username =
      typeof body.username === "string" ? body.username.trim() : "";

    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        {
          message: "Username dan password wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error(
        "[Login] ADMIN_USERNAME / ADMIN_PASSWORD belum dikonfigurasi.",
      );

      return NextResponse.json(
        {
          message: "Konfigurasi admin belum tersedia.",
        },
        {
          status: 500,
        },
      );
    }

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        {
          message: "Username atau password salah.",
        },
        {
          status: 401,
        },
      );
    }

    const token = await createSessionToken();

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("[Login Error]", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat login.",
      },
      {
        status: 500,
      },
    );
  }
}
