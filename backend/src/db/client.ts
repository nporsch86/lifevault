import Database from "better-sqlite3";
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

const dbPath = path.join(dbDir, "lifevault.db");
const nativeDb = new Database(dbPath);
nativeDb.pragma("journal_mode = WAL");

type SqlParams = { sql: string; args?: any[] };

const db = {
  execute(params: SqlParams | string) {
    const sql = typeof params === "string" ? params : params.sql;
    const args = typeof params === "string" ? [] : (params.args || []);
    const stmt = nativeDb.prepare(sql);
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith("SELECT") || sql.includes("RETURNING")) {
      const rows = stmt.all(...args);
      return { rows };
    } else {
      stmt.run(...args);
      return { rows: [] };
    }
  },
  close() {
    nativeDb.close();
  }
};

export default db;