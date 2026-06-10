import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const notes = new Hono();
notes.use("*", authMiddleware);

const createNoteSchema = z.object({
  event_id: z.string().optional(),
  title: z.string().optional().default(""),
  content: z.string().optional().default(""),
  is_handwritten: z.boolean().optional().default(false),
});

notes.get("/", async (c) => {
  const user = getUser(c);
  const eventId = c.req.query("event_id");
  let sql = `SELECT * FROM notes WHERE user_id = ?`;
  const args: any[] = [user.userId];
  if (eventId) { sql += ` AND event_id = ?`; args.push(eventId); }
  sql += ` ORDER BY updated_at DESC`;
  const result = await db.execute({ sql, args });
  return c.json({ notes: result.rows });
});

notes.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const id = crypto.randomUUID();
  const { event_id, title, content, is_handwritten } = parsed.data;
  const result = await db.execute({
    sql: `INSERT INTO notes (id, user_id, event_id, title, content, is_handwritten) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [id, user.userId, event_id || null, title, content, is_handwritten ? 1 : 0],
  });
  return c.json({ note: result.rows[0] }, 201);
});

notes.patch("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const body = await c.req.json();
  const existing = await db.execute({ sql: `SELECT id FROM notes WHERE id = ? AND user_id = ?`, args: [id, user.userId] });
  if (!existing.rows[0]) return c.json({ error: "Note not found" }, 404);

  const updates: string[] = [];
  const args: any[] = [];
  if (body.title !== undefined) { updates.push("title = ?"); args.push(body.title); }
  if (body.content !== undefined) { updates.push("content = ?"); args.push(body.content); }
  if (body.is_handwritten !== undefined) { updates.push("is_handwritten = ?"); args.push(body.is_handwritten ? 1 : 0); }
  if (updates.length === 0) return c.json({ error: "No fields to update" }, 400);
  updates.push("updated_at = datetime('now')");
  args.push(id, user.userId);

  const result = await db.execute({ sql: `UPDATE notes SET ${updates.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`, args });
  return c.json({ note: result.rows[0] });
});

notes.delete("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({ sql: `DELETE FROM notes WHERE id = ? AND user_id = ? RETURNING id`, args: [id, user.userId] });
  if (!result.rows[0]) return c.json({ error: "Note not found" }, 404);
  return c.json({ message: "Note deleted" });
});

export default notes;