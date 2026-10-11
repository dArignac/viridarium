import crypto from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "admin" | "user";
  isTwoFactorAuthenticated: boolean;
  iat?: number;
  exp?: number;
}

export const SESSION_COOKIE_NAME = "viridarium_session";
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const REFRESH_THRESHOLD_SECONDS = 24 * 60 * 60; // 24 hours

function getSessionSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    "viridarium_default_session_secret_change_in_production_32b";
  return crypto.createHash("sha256").update(secret).digest();
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  const secretKey = getSessionSecret();
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .encrypt(secretKey);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtDecrypt(token, secretKey, {
      clockTolerance: 15,
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "admin" | "user",
      isTwoFactorAuthenticated: Boolean(payload.isTwoFactorAuthenticated),
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function shouldRefreshSession(payload: { iat?: number }): boolean {
  if (!payload.iat) return false;
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - payload.iat;
  return elapsed > REFRESH_THRESHOLD_SECONDS;
}
