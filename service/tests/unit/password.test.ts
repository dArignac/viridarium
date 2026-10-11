import { describe, expect, it } from "vitest";
import {
  StrongPasswordSchema,
  hashPassword,
  verifyPassword,
} from "@/src/lib/auth/password";

describe("Password Strength & Cryptography", () => {
  it("rejects passwords shorter than 12 characters", () => {
    const result = StrongPasswordSchema.safeParse("Short1!aaaa");
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing uppercase characters", () => {
    const result = StrongPasswordSchema.safeParse("lowercase12345!@#");
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing lowercase characters", () => {
    const result = StrongPasswordSchema.safeParse("UPPERCASE12345!@#");
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing numeric characters", () => {
    const result = StrongPasswordSchema.safeParse("NoNumbersHere!@#");
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing special symbols", () => {
    const result = StrongPasswordSchema.safeParse("NoSymbols12345678");
    expect(result.success).toBe(false);
  });

  it("accepts valid complex passwords with >= 12 characters", () => {
    const result = StrongPasswordSchema.safeParse("ValidGarden2026!#$");
    expect(result.success).toBe(true);
  });

  it("hashes password with Argon2id and verifies valid and invalid attempts", async () => {
    const plain = "ValidGarden2026!#$";
    const hash = await hashPassword(plain);

    expect(hash).toContain("$argon2id$");

    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword(hash, "WrongPassword123!");
    expect(isWrong).toBe(false);
  });
});
