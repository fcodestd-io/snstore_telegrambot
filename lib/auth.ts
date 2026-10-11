import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function getAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
