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

// Wrapper to match libsql's async API
const db = {
  async execute(params: { sql: string; args?: any[] } | string) {
    const sql = typeof params === "string" ? params : params.sql;
    const args = typeof params === "string" ? [] : (params.args || []);
    const stmt = nativeDb.prepare(sql);
    if (sql.trim().toUpperCase().startsWith("SELECT") || sql.includes("RETURNING")) {
      const rows = stmt.all(...args);
      return { rows };
    } else {
      stmt.run(...args);
      return { rows: [] };
    }
  },
  async batch(statements: string[]) {
    const tx = nativeDb.transaction(() => {
      for (const sql of statements) {
        nativeDb.prepare(sql).run();
      }
    });
    tx();
  },
  close() {
    nativeDb.close();
  }
};

export default db;