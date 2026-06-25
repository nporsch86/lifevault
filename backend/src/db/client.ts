import dotenv from "dotenv";
dotenv.config();

// ---- Validate env vars at module load ----

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    const msg = `Missing required environment variable: ${name}`
      + `\n  Set it in your Render dashboard (Environment → Environment Variables)`
      + `\n  Or create a .env file with: ${name}=your-value`;
    console.error(msg);
    throw new Error(msg);
  }
  return val;
}

const TURSO_DATABASE_URL = requireEnv("TURSO_DATABASE_URL");
const TURSO_AUTH_TOKEN = requireEnv("TURSO_AUTH_TOKEN");

const apiUrl = TURSO_DATABASE_URL.replace("libsql://", "https://");

// ---- Types ----

type SqlParams = { sql: string; args?: any[] };

interface TursoResponse {
  results?: any[];
  error?: string;
}

interface TursoError {
  message: string;
  [key: string]: any;
}

// ---- DB Client ----

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

    let response: Response;
    try {
      response = await fetch(`${apiUrl}/v2/pipeline`, {
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
    } catch (fetchErr: any) {
      const msg = `Turso connection failed (check TURSO_DATABASE_URL): ${fetchErr.message}`;
      console.error(msg);
      throw new Error(msg);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "(no body)");
      const msg = `Turso API error (HTTP ${response.status}): ${body}`;
      console.error(msg);
      throw new Error(msg);
    }

    let data: TursoResponse;
    try {
      data = await response.json() as TursoResponse;
    } catch (parseErr: any) {
      const msg = `Failed to parse Turso response: ${parseErr.message}`;
      console.error(msg);
      throw new Error(msg);
    }

    if (data.error) {
      throw new Error(`Turso error: ${data.error}`);
    }

    // Parse results into rows
    const rows: Record<string, any>[] = [];
    const results = data.results || [];
    for (const result of results) {
      // Turso v2/pipeline returns type "ok" for success, "error" for failures
      if (result.type === "error") {
        const msg = result.error?.message || JSON.stringify(result.error);
        throw new Error(`Turso query error: ${msg}`);
      }
      if (result.type === "ok" && result.response?.type === "execute" && result.response?.result) {
        const cols = result.response.result.cols || [];
        const rowData = result.response.result.rows || [];
        for (const r of rowData) {
          const row: Record<string, any> = {};
          cols.forEach((col: any, i: number) => {
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