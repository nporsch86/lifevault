import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const sharing = new Hono();
sharing.use("*", authMiddleware);

// --- Calendar Sharing ---

const shareCalendarSchema = z.object({
  email: z.string().email("Invalid email address"),
  permission: z.enum(["view", "edit"]).optional().default("view"),
});

// Share a calendar with someone by email
sharing.post("/calendars/:calendarId/share", async (c) => {
  const user = getUser(c);
  const { calendarId } = c.req.param();
  const body = await c.req.json();
  const parsed = shareCalendarSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  // Verify calendar exists and user owns it
  const calendar = await db.execute({
    sql: `SELECT id, name, is_confidential FROM calendars WHERE id = ? AND user_id = ?`,
    args: [calendarId, user.userId],
  });
  if (!calendar.rows[0]) return c.json({ error: "Calendar not found" }, 404);

  const { email, permission } = parsed.data;

  // Don't allow sharing with yourself
  if (email === user.email) return c.json({ error: "Cannot share calendar with yourself" }, 400);

  // Check if share already exists
  const existing = await db.execute({
    sql: `SELECT id, status FROM calendar_shares WHERE calendar_id = ? AND shared_with_email = ?`,
    args: [calendarId, email],
  });
  if (existing.rows[0]) {
    const share = existing.rows[0] as any;
    return c.json({
      error: `Calendar already shared with ${email} (status: ${share.status})`,
      shareId: share.id,
    }, 409);
  }

  // Find if user exists with this email
  const targetUser = await db.execute({
    sql: `SELECT id FROM users WHERE email = ?`,
    args: [email],
  });

  const id = crypto.randomUUID();
  const result = await db.execute({
    sql: `INSERT INTO calendar_shares (id, calendar_id, owner_user_id, shared_with_email, shared_with_user_id, permission)
          VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      id, calendarId, user.userId, email,
      (targetUser.rows[0] as any)?.id || null,
      permission,
    ],
  });

  return c.json({ share: result.rows[0] }, 201);
});

// List shares for a calendar
sharing.get("/calendars/:calendarId/shares", async (c) => {
  const user = getUser(c);
  const { calendarId } = c.req.param();

  const calendar = await db.execute({
    sql: `SELECT id FROM calendars WHERE id = ? AND user_id = ?`,
    args: [calendarId, user.userId],
  });
  if (!calendar.rows[0]) return c.json({ error: "Calendar not found" }, 404);

  const result = await db.execute({
    sql: `SELECT * FROM calendar_shares WHERE calendar_id = ? ORDER BY created_at DESC`,
    args: [calendarId],
  });
  return c.json({ shares: result.rows });
});

// Remove a share
sharing.delete("/calendars/:calendarId/share/:shareId", async (c) => {
  const user = getUser(c);
  const { calendarId, shareId } = c.req.param();

  const result = await db.execute({
    sql: `DELETE FROM calendar_shares WHERE id = ? AND calendar_id = ? AND owner_user_id = ? RETURNING id`,
    args: [shareId, calendarId, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Share not found" }, 404);
  return c.json({ message: "Share removed" });
});

// List calendars shared with me
sharing.get("/shared-with-me", async (c) => {
  const user = getUser(c);

  // Get shares where I'm the target (by email or user_id)
  const result = await db.execute({
    sql: `SELECT cs.*, c.name as calendar_name, c.color as calendar_color, u.name as owner_name
          FROM calendar_shares cs
          JOIN calendars c ON cs.calendar_id = c.id
          JOIN users u ON cs.owner_user_id = u.id
          WHERE (cs.shared_with_user_id = ? OR cs.shared_with_email = ?)
          AND cs.status = 'accepted'
          ORDER BY cs.created_at DESC`,
    args: [user.userId, user.email],
  });
  return c.json({ sharedCalendars: result.rows });
});

// List pending invites for me
sharing.get("/invites", async (c) => {
  const user = getUser(c);

  const result = await db.execute({
    sql: `SELECT cs.*, c.name as calendar_name, c.color as calendar_color, u.name as owner_name
          FROM calendar_shares cs
          JOIN calendars c ON cs.calendar_id = c.id
          JOIN users u ON cs.owner_user_id = u.id
          WHERE (cs.shared_with_user_id = ? OR cs.shared_with_email = ?)
          AND cs.status = 'pending'
          ORDER BY cs.created_at DESC`,
    args: [user.userId, user.email],
  });
  return c.json({ invites: result.rows });
});

// Accept or decline a calendar share invite
sharing.patch("/invite/:shareId", async (c) => {
  const user = getUser(c);
  const { shareId } = c.req.param();
  const body = await c.req.json();
  const schema = z.object({
    action: z.enum(["accept", "decline"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid action" }, 400);

  const share = await db.execute({
    sql: `SELECT * FROM calendar_shares WHERE id = ? AND (shared_with_user_id = ? OR shared_with_email = ?)`,
    args: [shareId, user.userId, user.email],
  });
  if (!share.rows[0]) return c.json({ error: "Invite not found" }, 404);

  const status = parsed.data.action === "accept" ? "accepted" : "declined";
  const result = await db.execute({
    sql: `UPDATE calendar_shares SET status = ?, updated_at = ? WHERE id = ? RETURNING *`,
    args: [status, new Date().toISOString(), shareId],
  });
  return c.json({ share: result.rows[0] });
});

// --- Event Invites ---

const inviteToEventSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Invite someone to an event
sharing.post("/events/:eventId/invite", async (c) => {
  const user = getUser(c);
  const { eventId } = c.req.param();
  const body = await c.req.json();
  const parsed = inviteToEventSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  // Verify event exists and user has access
  const event = await db.execute({
    sql: `SELECT e.id, e.title, e.calendar_id FROM events e WHERE e.id = ? AND e.user_id = ?`,
    args: [eventId, user.userId],
  });
  if (!event.rows[0]) return c.json({ error: "Event not found" }, 404);

  const { email } = parsed.data;
  const ev = event.rows[0] as any;

  // Don't allow inviting yourself
  if (email === user.email) return c.json({ error: "Cannot invite yourself" }, 400);

  // Check if already invited
  const existing = await db.execute({
    sql: `SELECT id, status FROM event_invites WHERE event_id = ? AND invited_email = ?`,
    args: [eventId, email],
  });
  if (existing.rows[0]) {
    const inv = existing.rows[0] as any;
    return c.json({ error: `Already invited (status: ${inv.status})`, inviteId: inv.id }, 409);
  }

  // Find user if exists
  const targetUser = await db.execute({
    sql: `SELECT id FROM users WHERE email = ?`,
    args: [email],
  });

  const inviteId = crypto.randomUUID();
  const result = await db.execute({
    sql: `INSERT INTO event_invites (id, event_id, calendar_id, invited_by_user_id, invited_email, invited_user_id)
          VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      inviteId, eventId, ev.calendar_id, user.userId, email,
      (targetUser.rows[0] as any)?.id || null,
    ],
  });

  return c.json({ invite: result.rows[0] }, 201);
});

// List invites for an event
sharing.get("/events/:eventId/invites", async (c) => {
  const user = getUser(c);
  const { eventId } = c.req.param();

  const result = await db.execute({
    sql: `SELECT ei.* FROM event_invites ei JOIN events e ON ei.event_id = e.id WHERE e.id = ? AND e.user_id = ? ORDER BY ei.created_at DESC`,
    args: [eventId, user.userId],
  });
  return c.json({ invites: result.rows });
});

// Get my pending event invites
sharing.get("/my-invites", async (c) => {
  const user = getUser(c);

  const result = await db.execute({
    sql: `SELECT ei.*, e.title as event_title, e.start_time, e.end_time, u.name as invited_by_name
          FROM event_invites ei
          JOIN events e ON ei.event_id = e.id
          JOIN users u ON ei.invited_by_user_id = u.id
          WHERE (ei.invited_user_id = ? OR ei.invited_email = ?)
          AND ei.status = 'pending'
          ORDER BY e.start_time ASC`,
    args: [user.userId, user.email],
  });
  return c.json({ invites: result.rows });
});

// Accept/decline/maybe an event invite
sharing.patch("/invite/:inviteId/rsvp", async (c) => {
  const user = getUser(c);
  const { inviteId } = c.req.param();
  const body = await c.req.json();
  const schema = z.object({
    status: z.enum(["accepted", "declined", "maybe"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid RSVP status" }, 400);

  const invite = await db.execute({
    sql: `SELECT * FROM event_invites WHERE id = ? AND (invited_user_id = ? OR invited_email = ?)`,
    args: [inviteId, user.userId, user.email],
  });
  if (!invite.rows[0]) return c.json({ error: "Invite not found" }, 404);

  const result = await db.execute({
    sql: `UPDATE event_invites SET status = ?, rsvp_at = ? WHERE id = ? RETURNING *`,
    args: [parsed.data.status, new Date().toISOString(), inviteId],
  });
  return c.json({ invite: result.rows[0] });
});

// Get shared events (events from calendars shared with me)
sharing.get("/shared-events", async (c) => {
  const user = getUser(c);

  // Find all calendars shared with me that I've accepted
  const sharedCalendars = await db.execute({
    sql: `SELECT cs.calendar_id, cs.permission FROM calendar_shares cs
          WHERE (cs.shared_with_user_id = ? OR cs.shared_with_email = ?)
          AND cs.status = 'accepted'`,
    args: [user.userId, user.email],
  });

  if (sharedCalendars.rows.length === 0) {
    return c.json({ events: [] });
  }

  const calendarIds = (sharedCalendars.rows as any[]).map((r: any) => r.calendar_id);
  const placeholders = calendarIds.map(() => "?").join(",");

  const result = await db.execute({
    sql: `SELECT e.*, c.name as calendar_name, c.color as calendar_color, u.email as owner_email
          FROM events e
          JOIN calendars c ON e.calendar_id = c.id
          JOIN users u ON e.user_id = u.id
          WHERE e.calendar_id IN (${placeholders})
          ORDER BY e.start_time ASC`,
    args: calendarIds,
  });

  return c.json({ events: result.rows });
});

export default sharing;