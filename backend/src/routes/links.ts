import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const links = new Hono();
links.use("*", authMiddleware);

const createLinkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  alert_at: z.string().optional(),
});

links.get("/", async (c) => {
  const user = getUser(c);
  const result = await db.execute({
    sql: `SELECT * FROM links WHERE user_id = ? ORDER BY created_at DESC`,
    args: [user.userId],
  });
  return c.json({ links: result.rows });
});

links.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const id = crypto.randomUUID();
  const { url, title, notes, alert_at } = parsed.data;
  const result = await db.execute({
    sql: `INSERT INTO links (id, user_id, url, title, notes, alert_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [id, user.userId, url, title, notes, alert_at || null],
  });
  return c.json({ link: result.rows[0] }, 201);
});

links.delete("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({ sql: `DELETE FROM links WHERE id = ? AND user_id = ? RETURNING id`, args: [id, user.userId] });
  if (!result.rows[0]) return c.json({ error: "Link not found" }, 404);
  return c.json({ message: "Link deleted" });
});

export default links;