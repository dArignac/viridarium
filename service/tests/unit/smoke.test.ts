import { describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";

describe("Test Harness Smoke Test", () => {
  it("initializes an in-memory SQLite instance and executes a query", async () => {
    const { client } = await createTestDb();
    const result = await client.execute("SELECT 1 + 1 AS sum");
    expect(result.rows[0].sum).toBe(2);
  });
});
