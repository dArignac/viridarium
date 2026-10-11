import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import * as authSchema from "@/src/db/schema/auth";
import * as inventorySchema from "@/src/db/schema/inventory";

export async function createTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, {
    schema: {
      ...authSchema,
      ...inventorySchema,
    },
  });

  // Apply migrations
  const migrationsFolder = path.resolve(__dirname, "../../src/db/migrations");
  await migrate(db, { migrationsFolder });

  return { client, db };
}
