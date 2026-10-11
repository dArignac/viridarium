import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as authSchema from "./schema/auth";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const databaseUrl = process.env.DATABASE_URL || `file:${path.join(dataDir, "viridarium.db")}`;

export const client = createClient({
  url: databaseUrl,
});

export const db = drizzle(client, {
  schema: {
    ...authSchema,
  },
});

export * from "./schema/auth";
