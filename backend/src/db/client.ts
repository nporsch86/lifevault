import initSqlJs from "sql.js";
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

let nativeDb: any = null;

// Convert sql.js result format to { rows: object[] }
function rowsToObjects(columns: string[], values: any[][]): any[] {
  return values.map(row => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

async function getDb() {
  if (nativeDb) return nativeDb;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    nativeDb = new SQL.Database(buffer);
  } else {
    nativeDb = new SQL.Database();
  }
  nativeDb.run("PRAGMA journal_mode=WAL");
  // Save to disk periodically
  const saveDb = () => {
    try {
      const data = nativeDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error("Failed to save database:", e);
    }
  };
  // Save on events
  const origRun = nativeDb.run.bind(nativeDb);
  nativeDb.run = function(sql: string, params?: any) {
    origRun(sql, params);
    saveDb();
  };
  return nativeDb;
}

const db = {
  async execute(params: { sql: string; args?: any[] } | string) {
    const sql = typeof params === "string" ? params : params.sql;
    const args = typeof params === "string" ? [] : (params.args || []);
    const database = await getDb();
    
    const upperSql = sql.trim().toUpperCase();
    if (upperSql.startsWith("SELECT") || sql.includes("RETURNING")) {
      let stmt;
      if (args.length > 0) {
        // Use prepare/bind for parameterized queries
        stmt = database.prepare(sql);
        stmt.bind(args);
      } else {
        stmt = database.prepare(sql);
      }
      const columns = stmt.getColumnNames();
      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows };
    } else {
      if (args.length > 0) {
        database.run(sql, args);
      } else {
        database.run(sql);
      }
      return { rows: [] };
    }
  },
  close() {
    if (nativeDb) {
      const data = nativeDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      nativeDb.close();
    }
  }
};

export default db;