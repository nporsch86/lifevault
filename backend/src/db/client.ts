import dotenv from "dotenv";
dotenv.config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || "";

const apiUrl = TURSO_DATABASE_URL.replace("libsql://", "https://");

type SqlParams = { sql: string; args?: any[] };

interface TursoResponse {
  results?: Array<{
    type: string;
    response?: {
      result?: {
        cols?: Array<{ name: string }>;
        rows?: Array<Array<{ type: string; value: any }>>;
      };
    };
  >;
  error?: string;
}

const db = {
  async execute(params: SqlParams | string) {
    const sql = typeof params === "string" ? params : params.sql;
    const args = typeof params === "string" ? [] : (params.args || []);

    // Build the Turso HTTP API request
    const statements = [
      {
        q: sql,
        params: args.length > 0 ? args.map(v => ({ type: typeof v === "number" ? "integer" : "text", value: v })) : undefined,
      },
    ];

    const response = await fetch(`${apiUrl}/v2/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TURSO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: statements.map(s => ({
          type: "execute",
          stmt: { sql: s.q, args: s.params },
        })),
      }),
    });

    const data = await response.json() as TursoResponse;

    if (data.error) {
      throw new Error(data.error);
    }

    // Parse results
    const rows: Record<string, any>[] = [];
    const results = data.results || [];
    for (const result of results) {
      if (result.type === "execute" && result.response?.result) {
        const cols = result.response.result.cols || [];
        const rowData = result.response.result.rows || [];
        for (const r of rowData) {
          const row: Record<string, any> = {};
          cols.forEach((col, i) => {
            row[col.name] = r[i]?.value ?? null;
          });
          rows.push(row);
        }
      }
    }

    return { rows };
  },
};

export default db;