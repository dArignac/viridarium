"use server";

import crypto from "node:crypto";
import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db as defaultDb } from "@/src/db";
import { users } from "@/src/db/schema/auth";
import { hashPassword, verifyPassword } from "./password";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
} from "./session";
import {
  generateQrCodeDataUrl,
  generateRecoveryCodes,
  generateTotpSecret,
  verifyRecoveryCode,
  verifyTotpToken,
} from "./totp";
import { CreateUserSchema, LoginSchema } from "./schemas";

interface ActionContext {
  db?: typeof defaultDb;
  cookieJar?: {
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
    delete: (name: string) => void;
    get: (name: string) => { value: string } | undefined;
  };
}

async function resolveCookieStore(ctx?: ActionContext) {
  if (ctx?.cookieJar) {
    return ctx.cookieJar;
  }
  return await cookies();
}

export async function setupAdminAction(
  input: z.infer<typeof CreateUserSchema>,
  ctx?: ActionContext
) {
  const db = ctx?.db || defaultDb;
  const data = CreateUserSchema.parse(input);

  const existingCount = await db.select({ value: count() }).from(users);
  if (existingCount[0]?.value > 0) {
    throw new Error("Setup is disabled: an admin already exists.");
  }

  const passwordHash = await hashPassword(data.password);
  const userId = `usr_${crypto.randomUUID()}`;
  const now = new Date();

  await db.insert(users).values({
    id: userId,
    email: data.email,
    passwordHash,
    displayName: data.displayName,
    role: "admin",
    twoFactorEnabled: false,
    createdAt: now,
    updatedAt: now,
  });

  const sessionToken = await createSessionToken({
    userId,
    email: data.email,
    role: "admin",
    isTwoFactorAuthenticated: true,
  });

  const cookieStore = await resolveCookieStore(ctx);
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return {
    success: true,
    user: {
      id: userId,
      email: data.email,
      displayName: data.displayName,
      role: "admin",
    },
  };
}

export async function loginAction(
  input: z.infer<typeof LoginSchema>,
  ctx?: ActionContext
) {
  const db = ctx?.db || defaultDb;
  const data = LoginSchema.parse(input);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email));

  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  const isPasswordValid = await verifyPassword(user.passwordHash, data.password);
  if (!isPasswordValid) {
    return { success: false, error: "Invalid email or password." };
  }

  // If 2FA is required, issue temporary challenge token
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    const tempToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "user",
      isTwoFactorAuthenticated: false,
    });

    return {
      success: true,
      requires2fa: true,
      tempToken,
    };
  }

  // Issue full session
  const sessionToken = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role as "admin" | "user",
    isTwoFactorAuthenticated: true,
  });

  const cookieStore = await resolveCookieStore(ctx);
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return {
    success: true,
    requires2fa: false,
  };
}

export async function verify2faLoginAction(
  input: { tempToken: string; code: string },
  ctx?: ActionContext
) {
  const db = ctx?.db || defaultDb;
  const payload = await verifySessionToken(input.tempToken);

  if (!payload) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId));

  if (!user || !user.twoFactorSecret) {
    return { success: false, error: "User not found or 2FA not configured." };
  }

  // Check TOTP code
  let isValid = verifyTotpToken(user.twoFactorSecret, input.code);

  // If not valid TOTP code, check backup recovery code
  if (!isValid && user.recoveryCodes) {
    const recoveryCheck = verifyRecoveryCode(user.recoveryCodes, input.code);
    if (recoveryCheck.valid) {
      isValid = true;
      // Persist remaining recovery codes
      await db
        .update(users)
        .set({ recoveryCodes: JSON.stringify(recoveryCheck.remainingCodes) })
        .where(eq(users.id, user.id));
    }
  }

  if (!isValid) {
    return { success: false, error: "Invalid two-factor authentication code." };
  }

  // Issue full session
  const sessionToken = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role as "admin" | "user",
    isTwoFactorAuthenticated: true,
  });

  const cookieStore = await resolveCookieStore(ctx);
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return { success: true };
}

export async function generate2faSetupAction(email: string) {
  const { secret, uri } = generateTotpSecret(email);
  const qrDataUrl = await generateQrCodeDataUrl(uri);
  const recoveryCodes = generateRecoveryCodes(8);

  return { secret, qrDataUrl, recoveryCodes };
}

export async function confirm2faEnableAction(
  input: {
    userId: string;
    secret: string;
    code: string;
    recoveryCodes: string[];
  },
  ctx?: ActionContext
) {
  const db = ctx?.db || defaultDb;
  const isValid = verifyTotpToken(input.secret, input.code);

  if (!isValid) {
    return { success: false, error: "Invalid verification code." };
  }

  await db
    .update(users)
    .set({
      twoFactorEnabled: true,
      twoFactorSecret: input.secret,
      recoveryCodes: JSON.stringify(input.recoveryCodes),
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId));

  return { success: true };
}

export async function logoutAction(ctx?: ActionContext) {
  const cookieStore = await resolveCookieStore(ctx);
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}
