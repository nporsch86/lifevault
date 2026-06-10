import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const events = new Hono();
events.use("*", authMiddleware);

const createEventSchema = z.object({
  calendar_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  start_time: z.string(),
  end_time: z.string(),
  is_all_day: z.boolean().optional().default(false),
  meeting_link: z.string().optional(),
  meeting_notes: z.string().optional(),
  alert_minutes_before: z.number().int().optional().default(10),
});

const updateEventSchema = createEventSchema.partial();

events.get("/", async (c) => {
  const user = getUser(c);
  const calendarId = c.req.query("calendar_id");
  const from = c.req.query("from");
  const to = c.req.query("to");

  let sql = `SELECT e.*, c.name as calendar_name, c.color as calendar_color, c.is_confidential FROM events e JOIN calendars c ON e.calendar_id = c.id WHERE e.user_id = ?`;
  const args: any[] = [user.userId];

  if (calendarId) { sql += ` AND e.calendar_id = ?`; args.push(calendarId); }
  if (from) { sql += ` AND e.start_time >= ?`; args.push(from); }
  if (to) { sql += ` AND e.end_time <= ?`; args.push(to); }

  sql += ` ORDER BY e.start_time ASC`;

  const result = await db.execute({ sql, args });
  return c.json({ events: result.rows });
});

events.get("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `SELECT e.*, c.name as calendar_name, c.color as calendar_color FROM events e JOIN calendars c ON e.calendar_id = c.id WHERE e.id = ? AND e.user_id = ?`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Event not found" }, 404);
  return c.json({ event: result.rows[0] });
});

events.post("/", async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

    const id = crypto.randomUUID();
    const { calendar_id, title, description, start_time, end_time, is_all_day, meeting_link, meeting_notes, alert_minutes_before } = parsed.data;

    const result = await db.execute({
      sql: `INSERT INTO events (id, calendar_id, user_id, title, description, start_time, end_time, is_all_day, meeting_link, meeting_notes, alert_minutes_before)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [id, calendar_id, user.userId, title, description, start_time, end_time, is_all_day ? 1 : 0, meeting_link || null, meeting_notes || null, alert_minutes_before],
    });

    return c.json({ event: result.rows[0] }, 201);
  } catch (err) {
    console.error("Create event error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

events.patch("/:id", async (c) => {
  try {
    const user = getUser(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

    const existing = await db.execute({ sql: `SELECT id FROM events WHERE id = ? AND user_id = ?`, args: [id, user.userId] });
    if (!existing.rows[0]) return c.json({ error: "Event not found" }, 404);

    const updates: string[] = [];
    const args: any[] = [];
    const data = parsed.data;

    if (data.title !== undefined) { updates.push("title = ?"); args.push(data.title); }
    if (data.description !== undefined) { updates.push("description = ?"); args.push(data.description); }
    if (data.start_time !== undefined) { updates.push("start_time = ?"); args.push(data.start_time); }
    if (data.end_time !== undefined) { updates.push("end_time = ?"); args.push(data.end_time); }
    if (data.is_all_day !== undefined) { updates.push("is_all_day = ?"); args.push(data.is_all_day ? 1 : 0); }
    if (data.meeting_link !== undefined) { updates.push("meeting_link = ?"); args.push(data.meeting_link); }
    if (data.meeting_notes !== undefined) { updates.push("meeting_notes = ?"); args.push(data.meeting_notes); }
    if (data.alert_minutes_before !== undefined) { updates.push("alert_minutes_before = ?"); args.push(data.alert_minutes_before); }

    if (updates.length === 0) return c.json({ error: "No fields to update" }, 400);
    updates.push("updated_at = datetime('now')");
    args.push(id, user.userId);

    const result = await db.execute({
      sql: `UPDATE events SET ${updates.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`,
      args,
    });
    return c.json({ event: result.rows[0] });
  } catch (err) {
    console.error("Update event error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

events.delete("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({ sql: `DELETE FROM events WHERE id = ? AND user_id = ? RETURNING id`, args: [id, user.userId] });
  if (!result.rows[0]) return c.json({ error: "Event not found" }, 404);
  return c.json({ message: "Event deleted" });
});

export default events;