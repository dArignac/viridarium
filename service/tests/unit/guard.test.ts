import { describe, expect, it } from "vitest";
import {
  checkInstanceBootstrapStatus,
  ForbiddenError,
  UnauthorizedError,
  validateAdminSession,
  validateUserSession,
} from "@/src/lib/auth/guard";
import { createSessionToken } from "@/src/lib/auth/session";
import { users } from "@/src/db/schema/auth";
import { createTestDb } from "../helpers/db";

describe("Auth Guards & Tenant Isolation", () => {
  it("detects when instance bootstrap is needed (0 users)", async () => {
    const { db } = await createTestDb();
    const isBootstrapNeeded = await checkInstanceBootstrapStatus(db);
    expect(isBootstrapNeeded).toBe(true);

    // Insert user
    await db.insert(users).values({
      id: "usr_1",
      email: "admin@example.com",
      passwordHash: "hash",
      displayName: "Admin",
      role: "admin",
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const isBootstrapNeededNow = await checkInstanceBootstrapStatus(db);
    expect(isBootstrapNeededNow).toBe(false);
  });

  it("validates authenticated user sessions and throws UnauthorizedError for invalid tokens", async () => {
    // Missing token
    await expect(validateUserSession(undefined)).rejects.toThrow(
      UnauthorizedError
    );

    // Invalid token
    await expect(validateUserSession("invalid.token")).rejects.toThrow(
      UnauthorizedError
    );

    // Valid user token
    const token = await createSessionToken({
      userId: "usr_regular",
      email: "user@example.com",
      role: "user",
      isTwoFactorAuthenticated: true,
    });

    const sessionUser = await validateUserSession(token);
    expect(sessionUser.userId).toBe("usr_regular");
    expect(sessionUser.role).toBe("user");
  });

  it("enforces admin-only access and throws ForbiddenError for standard users", async () => {
    const regularToken = await createSessionToken({
      userId: "usr_regular",
      email: "user@example.com",
      role: "user",
      isTwoFactorAuthenticated: true,
    });

    await expect(validateAdminSession(regularToken)).rejects.toThrow(
      ForbiddenError
    );

    const adminToken = await createSessionToken({
      userId: "usr_admin",
      email: "admin@example.com",
      role: "admin",
      isTwoFactorAuthenticated: true,
    });

    const adminUser = await validateAdminSession(adminToken);
    expect(adminUser.userId).toBe("usr_admin");
    expect(adminUser.role).toBe("admin");
  });

  it("rejects sessions that require 2FA but have not completed 2FA verification", async () => {
    const unverified2faToken = await createSessionToken({
      userId: "usr_admin",
      email: "admin@example.com",
      role: "admin",
      isTwoFactorAuthenticated: false,
    });

    await expect(validateUserSession(unverified2faToken)).rejects.toThrow(
      UnauthorizedError
    );
  });
});
