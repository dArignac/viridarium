import { count } from "drizzle-orm";
import { cookies } from "next/headers";
import { db as defaultDb } from "@/src/db";
import { users } from "@/src/db/schema/auth";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "./session";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: Please log in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: Insufficient permissions.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type SessionUser = SessionPayload;

export async function checkInstanceBootstrapStatus(
  dbInstance = defaultDb
): Promise<boolean> {
  try {
    const result = await dbInstance.select({ value: count() }).from(users);
    return result[0]?.value === 0;
  } catch {
    // If the table does not exist yet, bootstrap is needed
    return true;
  }
}

export async function validateUserSession(
  token: string | undefined
): Promise<SessionUser> {
  if (!token) {
    throw new UnauthorizedError();
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.isTwoFactorAuthenticated) {
    throw new UnauthorizedError();
  }

  return payload;
}

export async function validateAdminSession(
  token: string | undefined
): Promise<SessionUser> {
  const user = await validateUserSession(token);
  if (user.role !== "admin") {
    throw new ForbiddenError();
  }
  return user;
}

/**
 * Server Component / Server Action helper to require an authenticated session.
 */
export async function requireUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return validateUserSession(token);
}

/**
 * Server Component / Server Action helper to require an admin session.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return validateAdminSession(token);
}
