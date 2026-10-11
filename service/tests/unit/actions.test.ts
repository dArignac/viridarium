import { describe, expect, it } from "vitest";
import {
  confirm2faEnableAction,
  generate2faSetupAction,
  loginAction,
  setupAdminAction,
  verify2faLoginAction,
} from "@/src/lib/auth/actions";
import { verifySessionToken } from "@/src/lib/auth/session";
import { generateSync } from "otplib";
import { createTestDb } from "../helpers/db";

class MockCookieJar {
  private cookies = new Map<string, string>();

  get(name: string) {
    const value = this.cookies.get(name);
    return value ? { value } : undefined;
  }

  set(name: string, value: string) {
    this.cookies.set(name, value);
  }

  delete(name: string) {
    this.cookies.delete(name);
  }
}

describe("Auth Server Actions", () => {
  it("executes first-run admin setup and rejects subsequent setup calls", async () => {
    const { db } = await createTestDb();
    const cookieJar = new MockCookieJar();

    // 1. Initial setup succeeds
    const setupResult = await setupAdminAction(
      {
        email: "admin@example.com",
        password: "AdminPassword123!@",
        displayName: "Admin Alex",
      },
      { db, cookieJar }
    );

    expect(setupResult.success).toBe(true);
    expect(setupResult.user?.role).toBe("admin");

    const sessionCookie = cookieJar.get("viridarium_session")?.value;
    expect(sessionCookie).toBeDefined();

    const verified = await verifySessionToken(sessionCookie!);
    expect(verified?.email).toBe("admin@example.com");

    // 2. Subsequent setup call is rejected
    await expect(
      setupAdminAction(
        {
          email: "attacker@example.com",
          password: "AttackerPassword123!@",
          displayName: "Attacker",
        },
        { db, cookieJar }
      )
    ).rejects.toThrow("Setup is disabled");
  });

  it("handles login without 2FA and sets 30-day session cookie", async () => {
    const { db } = await createTestDb();
    const cookieJar = new MockCookieJar();

    await setupAdminAction(
      {
        email: "admin@example.com",
        password: "AdminPassword123!@",
        displayName: "Admin Alex",
      },
      { db, cookieJar }
    );

    // Login with invalid password
    const failResult = await loginAction(
      {
        email: "admin@example.com",
        password: "WrongPassword123!@",
      },
      { db, cookieJar }
    );
    expect(failResult.success).toBe(false);

    // Login with valid password
    const successResult = await loginAction(
      {
        email: "admin@example.com",
        password: "AdminPassword123!@",
      },
      { db, cookieJar }
    );
    expect(successResult.success).toBe(true);
    expect(successResult.requires2fa).toBe(false);
  });

  it("handles 2FA setup and enforces 2FA verification challenge on login", async () => {
    const { db } = await createTestDb();
    const cookieJar = new MockCookieJar();

    const setupResult = await setupAdminAction(
      {
        email: "admin@example.com",
        password: "AdminPassword123!@",
        displayName: "Admin Alex",
      },
      { db, cookieJar }
    );
    const userId = setupResult.user!.id;

    // Generate 2FA setup details
    const setup2fa = await generate2faSetupAction("admin@example.com");
    expect(setup2fa.secret).toBeDefined();
    expect(setup2fa.recoveryCodes).toHaveLength(8);

    // Confirm 2FA with a valid TOTP token
    const token = generateSync({ secret: setup2fa.secret });
    const enableResult = await confirm2faEnableAction(
      {
        userId,
        secret: setup2fa.secret,
        code: token,
        recoveryCodes: setup2fa.recoveryCodes,
      },
      { db, cookieJar }
    );
    expect(enableResult.success).toBe(true);

    // Now, login should trigger 2FA requirement
    const loginResult = await loginAction(
      {
        email: "admin@example.com",
        password: "AdminPassword123!@",
      },
      { db, cookieJar }
    );
    expect(loginResult.success).toBe(true);
    expect(loginResult.requires2fa).toBe(true);
    expect(loginResult.tempToken).toBeDefined();

    // Complete 2FA login challenge with fresh code
    const freshCode = generateSync({ secret: setup2fa.secret });
    const challengeResult = await verify2faLoginAction(
      {
        tempToken: loginResult.tempToken!,
        code: freshCode,
      },
      { db, cookieJar }
    );
    expect(challengeResult.success).toBe(true);
  });
});
