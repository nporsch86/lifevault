import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./data/lifevault.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export default db;