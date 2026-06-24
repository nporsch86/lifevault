import { createClient } from "@libsql/client-wasm";
import dotenv from "dotenv";
dotenv.config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || "";

const turso = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

type SqlParams = { sql: string; args?: any[] };

const db = {
  async execute(params: SqlParams | string) {
    const sql = typeof params === "string" ? params : params.sql;
    const args = typeof params === "string" ? [] : (params.args || []);
    const result = await turso.execute({ sql, args });
    return { rows: result.rows };
  },
};

export default db;