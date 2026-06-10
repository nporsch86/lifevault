import { Hono } from "hono";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const templates = new Hono();
templates.use("*", authMiddleware);

templates.get("/", async (c) => {
  const result = await db.execute({
    sql: `SELECT id, name, description, type, price, downloads, created_at FROM templates ORDER BY downloads DESC`,
  });
  return c.json({ templates: result.rows });
});

templates.get("/:id", async (c) => {
  const { id } = c.req.param();
  const result = await db.execute({ sql: `SELECT * FROM templates WHERE id = ?`, args: [id] });
  if (!result.rows[0]) return c.json({ error: "Template not found" }, 404);
  return c.json({ template: result.rows[0] });
});

templates.post("/:id/download", async (c) => {
  const { id } = c.req.param();
  await db.execute({ sql: `UPDATE templates SET downloads = downloads + 1 WHERE id = ?`, args: [id] });
  const result = await db.execute({ sql: `SELECT * FROM templates WHERE id = ?`, args: [id] });
  if (!result.rows[0]) return c.json({ error: "Template not found" }, 404);
  return c.json({ template: result.rows[0] });
});

export default templates;