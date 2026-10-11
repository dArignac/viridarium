import { describe, expect, it } from "vitest";
import { users, sessions } from "@/src/db/schema/auth";
import { createTestDb } from "../helpers/db";

describe("Auth Database Schema", () => {
  it("creates tables via migrations and persists user and session records", async () => {
    const { db } = await createTestDb();

    const now = new Date();
    await db.insert(users).values({
      id: "usr_1",
      email: "alex@example.com",
      passwordHash: "argon2id_mock_hash",
      displayName: "Alex",
      role: "admin",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    const [insertedUser] = await db.select().from(users);
    expect(insertedUser).toBeDefined();
    expect(insertedUser.email).toBe("alex@example.com");
    expect(insertedUser.role).toBe("admin");
    expect(insertedUser.twoFactorEnabled).toBe(false);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      id: "sess_1",
      userId: insertedUser.id,
      expiresAt,
      createdAt: now,
    });

    const [insertedSession] = await db.select().from(sessions);
    expect(insertedSession).toBeDefined();
    expect(insertedSession.userId).toBe("usr_1");
  });
});
