import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";
import {
  storeCalDAVTokens,
  getCalDAVTokens,
  deleteCalDAVTokens,
  discoverCalendars,
  fetchEvents,
  putEvent,
  deleteEvent as caldavDeleteEvent,
  parseICalEvent,
  buildICalEvent,
} from "../services/appleCalendar.js";
import { recordSync, markEventSynced } from "../services/sync.js";

const appleSync = new Hono();
appleSync.use("*", authMiddleware);

// --- Apple Calendar (CalDAV) Connection ---

// Connect: store CalDAV credentials (app-specific password)
appleSync.post("/connect", async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const schema = z.object({
      server_url: z.string().url("Invalid server URL"),
      username: z.string().min(1, "Apple ID / username is required"),
      password: z.string().min(1, "App-specific password is required"),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    const { server_url, username, password } = parsed.data;

    // Test the connection by discovering calendars
    const calendars = await discoverCalendars(server_url, username, password);

    await storeCalDAVTokens(user.userId, server_url, username, password);

    return c.json({
      message: "Apple Calendar connected successfully",
      connected: true,
      calendarsDiscovered: calendars.length,
      calendars: calendars.map((cal) => ({
        href: cal.href,
        name: cal.displayName,
        color: cal.color,
      })),
    });
  } catch (err) {
    console.error("Apple Calendar connect error:", err);
    return c.json({ error: "Failed to connect to Apple Calendar" }, 500);
  }
});

// Check connection status
appleSync.get("/status", async (c) => {
  const user = getUser(c);
  const tokens = await getCalDAVTokens(user.userId);
  if (!tokens) {
    return c.json({ connected: false });
  }

  // Test connection
  const calendars = await discoverCalendars(tokens.server_url, tokens.username, tokens.password);

  return c.json({
    connected: true,
    serverUrl: tokens.server_url,
    username: tokens.username,
    calendarsFound: calendars.length,
    calendars: calendars.map((cal) => ({
      href: cal.href,
      name: cal.displayName,
      color: cal.color,
    })),
  });
});

// Disconnect
appleSync.post("/disconnect", async (c) => {
  const user = getUser(c);
  await deleteCalDAVTokens(user.userId);
  return c.json({ message: "Apple Calendar disconnected" });
});

// --- Sync Operations ---

// Discover available calendars
appleSync.get("/calendars", async (c) => {
  const user = getUser(c);
  const tokens = await getCalDAVTokens(user.userId);
  if (!tokens) {
    return c.json({ error: "Apple Calendar not connected" }, 400);
  }

  const calendars = await discoverCalendars(tokens.server_url, tokens.username, tokens.password);
  return c.json({ calendars });
});

// Pull events from Apple Calendar
appleSync.post("/pull", async (c) => {
  const user = getUser(c);
  const tokens = await getCalDAVTokens(user.userId);
  if (!tokens) {
    return c.json({ error: "Apple Calendar not connected" }, 400);
  }

  const body = await c.req.json().catch(() => ({})) as any;
  const calendarHref = body.calendarHref;

  if (!calendarHref) {
    return c.json({ error: "calendarHref is required" }, 400);
  }

  // Get or create a Lifevault calendar for this Apple calendar
  const calResult = await db.execute({
    sql: `SELECT id FROM calendars WHERE user_id = ? AND name = ? ORDER BY created_at ASC LIMIT 1`,
    args: [user.userId, `Apple Calendar (${calendarHref.split("/").pop() || "default"})`],
  });

  let calendarId: string;
  if (calResult.rows[0]) {
    calendarId = (calResult.rows[0] as any).id;
  } else {
    calendarId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO calendars (id, user_id, name, color) VALUES (?, ?, ?, ?)`,
      args: [calendarId, user.userId, `Apple Calendar (${calendarHref.split("/").pop() || "default"})`, "#007AFF"],
    });
  }

  // Fetch events from Apple Calendar
  const events = await fetchEvents(tokens.server_url, calendarHref, tokens.username, tokens.password);
  const imported: any[] = [];

  for (const calEvent of events) {
    const parsed = parseICalEvent(calEvent.icalData);
    if (!parsed) continue;

    // Check if already imported by UID (stored as remote_id in sync_states)
    const existing = await db.execute({
      sql: `SELECT ss.entity_id FROM sync_states ss WHERE ss.user_id = ? AND ss.entity_type = 'event' AND ss.remote_id = ?`,
      args: [user.userId, parsed.uid],
    });

    if (existing.rows[0]) {
      // Update existing event
      const eventId = (existing.rows[0] as any).entity_id;
      await db.execute({
        sql: `UPDATE events SET title = ?, description = ?, start_time = ?, end_time = ?, is_all_day = ?, updated_at = ? WHERE id = ?`,
        args: [parsed.summary, parsed.description, parsed.startTime, parsed.endTime, parsed.isAllDay ? 1 : 0, new Date().toISOString(), eventId],
      });
      continue;
    }

    // Import new event
    const newId = crypto.randomUUID();
    const insertResult = await db.execute({
      sql: `INSERT INTO events (id, calendar_id, user_id, title, description, start_time, end_time, is_all_day, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced') RETURNING *`,
      args: [newId, calendarId, user.userId, parsed.summary, parsed.description, parsed.startTime, parsed.endTime, parsed.isAllDay ? 1 : 0],
    });

    await recordSync(user.userId, "event", newId, parsed.uid, "remote_to_local");
    imported.push(insertResult.rows[0]);
  }

  return c.json({ imported: imported.length, total: events.length });
});

// Push a Lifevault event to Apple Calendar
appleSync.post("/push-event/:eventId", async (c) => {
  const user = getUser(c);
  const tokens = await getCalDAVTokens(user.userId);
  if (!tokens) {
    return c.json({ error: "Apple Calendar not connected" }, 400);
  }

  const { eventId } = c.req.param();
  const body = await c.req.json().catch(() => ({})) as any;
  const calendarHref = body.calendarHref;
  if (!calendarHref) {
    return c.json({ error: "calendarHref is required" }, 400);
  }

  // Get the event
  const eventResult = await db.execute({
    sql: `SELECT * FROM events WHERE id = ? AND user_id = ?`,
    args: [eventId, user.userId],
  });

  if (!eventResult.rows[0]) {
    return c.json({ error: "Event not found" }, 404);
  }

  const event = eventResult.rows[0] as any;

  // Check if event already has a CalDAV remote ID
  const syncState = await db.execute({
    sql: `SELECT remote_id FROM sync_states WHERE user_id = ? AND entity_type = 'event' AND entity_id = ?`,
    args: [user.userId, eventId],
  });

  const uid = (syncState.rows[0] as any)?.remote_id || eventId;

  // Build iCal data
  const icalData = buildICalEvent(
    uid,
    event.title,
    event.description || "",
    event.start_time,
    event.end_time,
    event.is_all_day === 1
  );

  // Create event href
  const eventHref = `${calendarHref.replace(/\/$/, "")}/${uid}.ics`;

  // Push to Apple Calendar
  const etag = await putEvent(
    tokens.server_url,
    calendarHref,
    eventHref,
    icalData,
    tokens.username,
    tokens.password
  );

  if (!etag) {
    return c.json({ error: "Failed to push event to Apple Calendar" }, 502);
  }

  await markEventSynced(eventId, uid);
  await recordSync(user.userId, "event", eventId, uid, "local_to_remote");

  return c.json({ message: "Event synced to Apple Calendar", uid, etag });
});

// Full sync: pull from Apple, push local unsynced
appleSync.post("/full-sync", async (c) => {
  const user = getUser(c);
  const tokens = await getCalDAVTokens(user.userId);
  if (!tokens) {
    return c.json({ error: "Apple Calendar not connected" }, 400);
  }

  const body = await c.req.json().catch(() => ({})) as any;
  const calendarHref = body.calendarHref;

  if (!calendarHref) {
    return c.json({ error: "calendarHref is required" }, 400);
  }

  const results: any = { pushed: 0, pulled: 0, errors: [] };

  // Step 1: Push local unsynced events
  const unsyncedEvents = await db.execute({
    sql: `SELECT e.*, c.name as calendar_name FROM events e JOIN calendars c ON e.calendar_id = c.id
          WHERE e.user_id = ? AND e.sync_status = 'local'`,
    args: [user.userId],
  });

  for (const row of unsyncedEvents.rows) {
    const event = row as any;
    try {
      const uid = event.id;
      const icalData = buildICalEvent(
        uid, event.title, event.description || "",
        event.start_time, event.end_time, event.is_all_day === 1
      );
      const eventHref = `${calendarHref.replace(/\/$/, "")}/${uid}.ics`;

      const etag = await putEvent(tokens.server_url, calendarHref, eventHref, icalData, tokens.username, tokens.password);
      if (etag) {
        await markEventSynced(event.id, uid);
        await recordSync(user.userId, "event", event.id, uid, "local_to_remote");
        results.pushed++;
      }
    } catch (err: any) {
      results.errors.push({ eventId: event.id, error: err.message });
    }
  }

  // Step 2: Pull remote events
  try {
    // Get or create Lifevault calendar
    const calResult = await db.execute({
      sql: `SELECT id FROM calendars WHERE user_id = ? AND name = ? ORDER BY created_at ASC LIMIT 1`,
      args: [user.userId, `Apple Calendar (${calendarHref.split("/").pop() || "default"})`],
    });

    let calendarId: string;
    if (calResult.rows[0]) {
      calendarId = (calResult.rows[0] as any).id;
    } else {
      calendarId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO calendars (id, user_id, name, color) VALUES (?, ?, ?, ?)`,
        args: [calendarId, user.userId, `Apple Calendar (${calendarHref.split("/").pop() || "default"})`, "#007AFF"],
      });
    }

    const events = await fetchEvents(tokens.server_url, calendarHref, tokens.username, tokens.password);
    for (const calEvent of events) {
      const parsed = parseICalEvent(calEvent.icalData);
      if (!parsed) continue;

      const existing = await db.execute({
        sql: `SELECT ss.entity_id FROM sync_states ss WHERE ss.user_id = ? AND ss.entity_type = 'event' AND ss.remote_id = ?`,
        args: [user.userId, parsed.uid],
      });

      if (existing.rows[0]) continue;

      const newId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO events (id, calendar_id, user_id, title, description, start_time, end_time, is_all_day, sync_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
        args: [newId, calendarId, user.userId, parsed.summary, parsed.description, parsed.startTime, parsed.endTime, parsed.isAllDay ? 1 : 0],
      });

      await recordSync(user.userId, "event", newId, parsed.uid, "remote_to_local");
      results.pulled++;
    }
  } catch (err: any) {
    results.errors.push({ phase: "pull", error: err.message });
  }

  return c.json({ message: "Full sync completed", results });
});

export default appleSync;