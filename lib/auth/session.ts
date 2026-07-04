import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Stateless session management with signed JWTs in an httpOnly cookie.
 *
 * Security decisions:
 * - httpOnly: token is invisible to client-side JS (XSS cannot exfiltrate it)
 * - sameSite=lax: cookie is not sent on cross-site POSTs (CSRF mitigation)
 * - secure in production: cookie only travels over HTTPS
 * - HS256 with a >= 32 char server-only secret; 7-day expiry enforced by jose
 * - verifySessionToken is Edge-runtime safe so middleware can gate routes
 *   without a database round-trip
 */

export const SESSION_COOKIE = "virasat_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. See .env.example.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/** Returns the session user, or null for a missing/invalid/expired token. */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Server-side helper: read + verify the session cookie of the current request. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
