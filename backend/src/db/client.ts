import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL 
  : process.env.TURSO_DATABASE_URL 
    ? process.env.TURSO_DATABASE_URL 
    : `file:${path.join(dbDir, "lifevault.db")}`;

const db = createClient({
  url: dbPath,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export default db;