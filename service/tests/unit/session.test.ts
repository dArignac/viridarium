import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  shouldRefreshSession,
  verifySessionToken,
  type SessionPayload,
} from "@/src/lib/auth/session";

describe("Session Sealing & Sliding Window", () => {
  const samplePayload: SessionPayload = {
    userId: "usr_123",
    email: "alex@example.com",
    role: "admin",
    isTwoFactorAuthenticated: true,
  };

  it("seals and verifies an encrypted session token", async () => {
    const token = await createSessionToken(samplePayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("usr_123");
    expect(verified?.email).toBe("alex@example.com");
    expect(verified?.role).toBe("admin");
    expect(verified?.isTwoFactorAuthenticated).toBe(true);
  });

  it("rejects forged or corrupted session tokens", async () => {
    const verified = await verifySessionToken("corrupted.jwt.token");
    expect(verified).toBeNull();
  });

  it("determines when a session should be refreshed based on elapsed time", () => {
    const now = Math.floor(Date.now() / 1000);

    // Fresh session issued just now (< 24 hours old)
    expect(shouldRefreshSession({ iat: now })).toBe(false);

    // Session issued 2 days ago (> 24 hours old)
    const twoDaysAgo = now - 2 * 24 * 60 * 60;
    expect(shouldRefreshSession({ iat: twoDaysAgo })).toBe(true);
  });
});
