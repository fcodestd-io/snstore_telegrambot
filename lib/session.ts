import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "sn_admin_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET belum dikonfigurasi.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken() {
  return new SignJWT({
    role: "admin",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (payload.role !== "admin") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
