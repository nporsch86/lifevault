import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const calendars = new Hono();
calendars.use("*", authMiddleware);

const createCalendarSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional().default("#3B82F6"),
  is_confidential: z.boolean().optional().default(false),
  google_calendar_id: z.string().optional(),
});

const updateCalendarSchema = createCalendarSchema.partial();

calendars.get("/", async (c) => {
  const user = getUser(c);
  const result = await db.execute({
    sql: `SELECT * FROM calendars WHERE user_id = ? ORDER BY created_at ASC`,
    args: [user.userId],
  });
  return c.json({ calendars: result.rows });
});

calendars.get("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `SELECT * FROM calendars WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Calendar not found" }, 404);
  return c.json({ calendar: result.rows[0] });
});

calendars.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();
  const parsed = createCalendarSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const id = crypto.randomUUID();
  const { name, color, is_confidential, google_calendar_id } = parsed.data;
  const result = await db.execute({
    sql: `INSERT INTO calendars (id, user_id, name, color, is_confidential, google_calendar_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [id, user.userId, name, color, is_confidential ? 1 : 0, google_calendar_id || null],
  });
  return c.json({ calendar: result.rows[0] }, 201);
});

calendars.patch("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = updateCalendarSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const existing = await db.execute({
    sql: `SELECT id FROM calendars WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!existing.rows[0]) return c.json({ error: "Calendar not found" }, 404);

  const updates: string[] = [];
  const args: any[] = [];
  const data = parsed.data;

  if (data.name !== undefined) { updates.push("name = ?"); args.push(data.name); }
  if (data.color !== undefined) { updates.push("color = ?"); args.push(data.color); }
  if (data.is_confidential !== undefined) { updates.push("is_confidential = ?"); args.push(data.is_confidential ? 1 : 0); }
  if (data.google_calendar_id !== undefined) { updates.push("google_calendar_id = ?"); args.push(data.google_calendar_id); }

  if (updates.length === 0) return c.json({ error: "No fields to update" }, 400);
  args.push(id, user.userId);

  const result = await db.execute({
    sql: `UPDATE calendars SET ${updates.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`,
    args,
  });
  return c.json({ calendar: result.rows[0] });
});

calendars.delete("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `DELETE FROM calendars WHERE id = ? AND user_id = ? RETURNING id`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Calendar not found" }, 404);
  return c.json({ message: "Calendar deleted" });
});

export default calendars;