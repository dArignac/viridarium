import { describe, expect, it } from "vitest";
import {
  generateRecoveryCodes,
  generateTotpSecret,
  generateQrCodeDataUrl,
  verifyRecoveryCode,
  verifyTotpToken,
} from "@/src/lib/auth/totp";
import { generateSync } from "otplib";

describe("TOTP Two-Factor Authentication", () => {
  it("generates a valid TOTP secret and otpauth URI", () => {
    const { secret, uri } = generateTotpSecret("alex@example.com");
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThan(10);
    expect(uri).toContain("otpauth://totp/Viridarium:alex%40example.com");
    expect(uri).toContain(`secret=${secret}`);
  });

  it("generates a QR code data URL from URI", async () => {
    const { uri } = generateTotpSecret("alex@example.com");
    const dataUrl = await generateQrCodeDataUrl(uri);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("verifies a valid TOTP token and rejects invalid tokens", () => {
    const { secret } = generateTotpSecret("alex@example.com");
    const validToken = generateSync({ secret });

    expect(verifyTotpToken(secret, validToken)).toBe(true);
    expect(verifyTotpToken(secret, "000000")).toBe(false);
    expect(verifyTotpToken(secret, "abcdef")).toBe(false);
  });

  it("generates and verifies single-use recovery codes", () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);

    const firstCode = codes[0];
    const codesJson = JSON.stringify(codes);

    const { valid, remainingCodes } = verifyRecoveryCode(codesJson, firstCode);
    expect(valid).toBe(true);
    expect(remainingCodes).toHaveLength(7);
    expect(remainingCodes).not.toContain(firstCode);

    // Reusing the same code should fail
    const reused = verifyRecoveryCode(JSON.stringify(remainingCodes), firstCode);
    expect(reused.valid).toBe(false);
  });
});
