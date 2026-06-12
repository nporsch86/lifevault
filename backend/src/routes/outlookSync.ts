import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";
import {
  getAuthUrl,
  exchangeCodeForTokens,
  getTokens,
  deleteTokens,
  getValidAccessToken,
  getUserProfile,
  listCalendars,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent as msDeleteEvent,
  storeTokens,
} from "../services/microsoftCalendar.js";
import { recordSync, markEventSynced } from "../services/sync.js";

const outlookSync = new Hono();
outlookSync.use("*", authMiddleware);

// --- OAuth Flow ---

// Get Microsoft OAuth URL
outlookSync.get("/auth-url", async (c) => {
  const user = getUser(c);
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: "Outlook Calendar integration not configured" }, 501);
  }

  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3001/api/outlook/callback";
  const state = Buffer.from(JSON.stringify({ userId: user.userId })).toString("base64url");

  const authUrl = getAuthUrl(clientId, redirectUri, state);
  return c.json({ authUrl });
});

// OAuth callback — exchange code for tokens
outlookSync.post("/callback", async (c) => {
  try {
    const body = await c.req.json() as any;
    const { code, state } = body;

    if (!code) return c.json({ error: "Authorization code is required" }, 400);

    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      userId = stateData.userId;
    } catch {
      const user = getUser(c);
      userId = user.userId;
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3001/api/outlook/callback";

    if (!clientId || !clientSecret) {
      return c.json({ error: "Outlook Calendar not configured" }, 501);
    }

    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
    if (!tokens) {
      return c.json({ error: "Failed to exchange authorization code" }, 400);
    }

    // Get user profile
    let email: string | undefined;
    const profile = await getUserProfile(tokens.accessToken);
    if (profile) email = profile.email;

    await storeTokens(userId, tokens.accessToken, tokens.refreshToken, tokens.expiryDate, email);

    return c.json({
      message: "Outlook Calendar connected successfully",
      connected: true,
      email: email || null,
    });
  } catch (err) {
    console.error("Outlook OAuth callback error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Check connection status
outlookSync.get("/status", async (c) => {
  const user = getUser(c);
  const tokens = await getTokens(user.userId);
  if (!tokens) return c.json({ connected: false });

  return c.json({
    connected: true,
    email: tokens.microsoft_email,
    expiryDate: tokens.expiry_date,
  });
});

// Disconnect
outlookSync.post("/disconnect", async (c) => {
  const user = getUser(c);
  await deleteTokens(user.userId);
  return c.json({ message: "Outlook Calendar disconnected" });
});

// --- Calendar Discovery ---

outlookSync.get("/calendars", async (c) => {
  const user = getUser(c);
  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";

  const accessToken = await getValidAccessToken(user.userId, clientId, clientSecret);
  if (!accessToken) return c.json({ error: "Outlook Calendar not connected" }, 400);

  const calendars = await listCalendars(accessToken);
  return c.json({ calendars });
});

// --- Sync Operations ---

// Pull events from Outlook
outlookSync.post("/pull", async (c) => {
  const user = getUser(c);
  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";

  const accessToken = await getValidAccessToken(user.userId, clientId, clientSecret);
  if (!accessToken) return c.json({ error: "Outlook Calendar not connected" }, 400);

  const body = await c.req.json().catch(() => ({})) as any;
  const calendarId = body.calendarId;
  if (!calendarId) return c.json({ error: "calendarId is required" }, 400);

  // Get or create Lifevault calendar for this Outlook calendar
  const calResult = await db.execute({
    sql: `SELECT id FROM calendars WHERE user_id = ? AND google_calendar_id = ? ORDER BY created_at ASC LIMIT 1`,
    args: [user.userId, `outlook-${calendarId}`],
  });

  let localCalendarId: string;
  if (calResult.rows[0]) {
    localCalendarId = (calResult.rows[0] as any).id;
  } else {
    localCalendarId = crypto.randomUUID();
    const calendarName = body.calendarName || "Outlook Calendar";
    await db.execute({
      sql: `INSERT INTO calendars (id, user_id, name, color, google_calendar_id) VALUES (?, ?, ?, ?, ?)`,
      args: [localCalendarId, user.userId, calendarName, "#0078D4", `outlook-${calendarId}`],
    });
  }

  // Fetch events from Outlook
  const events = await listEvents(accessToken, calendarId);
  const imported: any[] = [];

  for (const msEvent of events) {
    // Check if already imported by Outlook event ID
    const existing = await db.execute({
      sql: `SELECT entity_id FROM sync_states WHERE user_id = ? AND entity_type = 'event' AND remote_id = ?`,
      args: [user.userId, msEvent.id],
    });

    if (existing.rows[0]) {
      // Update existing event
      const eventId = (existing.rows[0] as any).entity_id;
      await db.execute({
        sql: `UPDATE events SET title = ?, description = ?, start_time = ?, end_time = ?, is_all_day = ?, updated_at = ? WHERE id = ?`,
        args: [
          msEvent.subject || "Untitled Event",
          msEvent.bodyPreview || "",
          msEvent.start.dateTime,
          msEvent.end.dateTime,
          msEvent.isAllDay ? 1 : 0,
          new Date().toISOString(),
          eventId,
        ],
      });
      continue;
    }

    // Import new event
    const newId = crypto.randomUUID();
    const insertResult = await db.execute({
      sql: `INSERT INTO events (id, calendar_id, user_id, title, description, start_time, end_time, is_all_day, meeting_link, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced') RETURNING *`,
      args: [
        newId, localCalendarId, user.userId,
        msEvent.subject || "Untitled Event",
        msEvent.bodyPreview || "",
        msEvent.start.dateTime,
        msEvent.end.dateTime,
        msEvent.isAllDay ? 1 : 0,
        msEvent.onlineMeetingUrl || null,
      ],
    });

    await recordSync(user.userId, "event", newId, msEvent.id, "remote_to_local");
    imported.push(insertResult.rows[0]);
  }

  return c.json({ imported: imported.length, total: events.length });
});

// Push a Lifevault event to Outlook
outlookSync.post("/push-event/:eventId", async (c) => {
  const user = getUser(c);
  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";

  const accessToken = await getValidAccessToken(user.userId, clientId, clientSecret);
  if (!accessToken) return c.json({ error: "Outlook Calendar not connected" }, 400);

  const { eventId } = c.req.param();
  const body = await c.req.json().catch(() => ({})) as any;
  const calendarId = body.calendarId;
  if (!calendarId) return c.json({ error: "calendarId is required" }, 400);

  // Get the event
  const eventResult = await db.execute({
    sql: `SELECT * FROM events WHERE id = ? AND user_id = ?`,
    args: [eventId, user.userId],
  });

  if (!eventResult.rows[0]) return c.json({ error: "Event not found" }, 404);

  const event = eventResult.rows[0] as any;

  // Check if already synced
  const syncState = await db.execute({
    sql: `SELECT remote_id FROM sync_states WHERE user_id = ? AND entity_type = 'event' AND entity_id = ?`,
    args: [user.userId, eventId],
  });

  const msEventId = (syncState.rows[0] as any)?.remote_id;

  const eventData = {
    subject: event.title,
    body: event.description || "",
    start: { dateTime: event.start_time, timeZone: "UTC" },
    end: { dateTime: event.end_time, timeZone: "UTC" },
    isAllDay: event.is_all_day === 1,
  };

  let newMsEventId: string | null;

  if (msEventId) {
    // Update existing
    const success = await updateEvent(accessToken, calendarId, msEventId, eventData);
    if (!success) return c.json({ error: "Failed to update event in Outlook" }, 502);
    newMsEventId = msEventId;
  } else {
    // Create new
    newMsEventId = await createEvent(accessToken, calendarId, eventData);
    if (!newMsEventId) return c.json({ error: "Failed to create event in Outlook" }, 502);
  }

  await markEventSynced(eventId, newMsEventId!);
  await recordSync(user.userId, "event", eventId, newMsEventId, "local_to_remote");

  return c.json({ message: "Event synced to Outlook", outlookEventId: newMsEventId });
});

// Full bidirectional sync
outlookSync.post("/full-sync", async (c) => {
  const user = getUser(c);
  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";

  const accessToken = await getValidAccessToken(user.userId, clientId, clientSecret);
  if (!accessToken) return c.json({ error: "Outlook Calendar not connected" }, 400);

  const body = await c.req.json().catch(() => ({})) as any;
  const calendarId = body.calendarId;
  const calendarName = body.calendarName || "Outlook Calendar";

  if (!calendarId) return c.json({ error: "calendarId is required" }, 400);

  const results: any = { pushed: 0, pulled: 0, errors: [] };

  // Step 1: Push local unsynced events
  const unsyncedEvents = await db.execute({
    sql: `SELECT e.* FROM events e WHERE e.user_id = ? AND e.sync_status = 'local'`,
    args: [user.userId],
  });

  for (const row of unsyncedEvents.rows) {
    const event = row as any;
    try {
      const eventData = {
        subject: event.title,
        body: event.description || "",
        start: { dateTime: event.start_time, timeZone: "UTC" },
        end: { dateTime: event.end_time, timeZone: "UTC" },
        isAllDay: event.is_all_day === 1,
      };
      const newId = await createEvent(accessToken, calendarId, eventData);
      if (newId) {
        await markEventSynced(event.id, newId);
        await recordSync(user.userId, "event", event.id, newId, "local_to_remote");
        results.pushed++;
      }
    } catch (err: any) {
      results.errors.push({ eventId: event.id, error: err.message });
    }
  }

  // Step 2: Pull remote events
  try {
    const calResult = await db.execute({
      sql: `SELECT id FROM calendars WHERE user_id = ? AND google_calendar_id = ? ORDER BY created_at ASC LIMIT 1`,
      args: [user.userId, `outlook-${calendarId}`],
    });

    let localCalendarId: string;
    if (calResult.rows[0]) {
      localCalendarId = (calResult.rows[0] as any).id;
    } else {
      localCalendarId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO calendars (id, user_id, name, color, google_calendar_id) VALUES (?, ?, ?, ?, ?)`,
        args: [localCalendarId, user.userId, calendarName, "#0078D4", `outlook-${calendarId}`],
      });
    }

    const events = await listEvents(accessToken, calendarId);
    for (const msEvent of events) {
      const existing = await db.execute({
        sql: `SELECT entity_id FROM sync_states WHERE user_id = ? AND entity_type = 'event' AND remote_id = ?`,
        args: [user.userId, msEvent.id],
      });
      if (existing.rows[0]) continue;

      const newId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO events (id, calendar_id, user_id, title, description, start_time, end_time, is_all_day, meeting_link, sync_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
        args: [
          newId, localCalendarId, user.userId,
          msEvent.subject || "Untitled Event",
          msEvent.bodyPreview || "",
          msEvent.start.dateTime, msEvent.end.dateTime,
          msEvent.isAllDay ? 1 : 0,
          msEvent.onlineMeetingUrl || null,
        ],
      });

      await recordSync(user.userId, "event", newId, msEvent.id, "remote_to_local");
      results.pulled++;
    }
  } catch (err: any) {
    results.errors.push({ phase: "pull", error: err.message });
  }

  return c.json({ message: "Full sync completed", results });
});

export default outlookSync;