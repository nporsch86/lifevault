import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";
import {
  storeTokens,
  getTokens,
  getValidAccessToken,
  pushEventToGoogle,
  pullEventsFromGoogle,
  deleteGoogleEvent,
} from "../services/googleCalendar.js";
import { markEventSynced, markEventDirty, recordSync } from "../services/sync.js";

const sync = new Hono();
sync.use("*", authMiddleware);

// --- Google Calendar OAuth ---
// The frontend initiates OAuth by redirecting to Google.
// After auth, Google redirects to our callback URL which exchanges the code for tokens.

// Initiate OAuth flow (returns the Google auth URL)
sync.get("/google/auth-url", async (c) => {
  const user = getUser(c);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: "Google Calendar integration not configured" }, 501);
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${c.req.url.split("/api")[0]}/api/sync/google/callback`;
  const state = Buffer.from(JSON.stringify({ userId: user.userId })).toString("base64");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return c.json({ authUrl: authUrl.toString() });
});

// OAuth callback — exchange code for tokens
sync.post("/google/callback", async (c) => {
  try {
    const body = await c.req.json() as any;
    const { code, state } = body;

    if (!code) return c.json({ error: "Authorization code is required" }, 400);

    // Decode state to get user info
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      userId = stateData.userId;
    } catch {
      // Fallback: use authenticated user
      const user = getUser(c);
      userId = user.userId;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${c.req.url.split("/api")[0]}/api/sync/google/callback`;

    if (!clientId || !clientSecret) {
      return c.json({ error: "Google Calendar integration not configured" }, 501);
    }

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token exchange failed:", errText);
      return c.json({ error: "Failed to exchange authorization code" }, 400);
    }

    const tokenData = await tokenResponse.json() as any;
    const expiryDate = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

    // Get user's Google Calendar email
    let googleEmail: string | undefined;
    try {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json() as any;
        googleEmail = profile.email;
      }
    } catch { /* non-fatal */ }

    await storeTokens(userId, tokenData.access_token, tokenData.refresh_token, expiryDate, googleEmail);

    return c.json({
      message: "Google Calendar connected successfully",
      connected: true,
      email: googleEmail || null,
    });
  } catch (err) {
    console.error("OAuth callback error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Check connection status
sync.get("/google/status", async (c) => {
  const user = getUser(c);
  const tokens = await getTokens(user.userId);
  if (!tokens) {
    return c.json({ connected: false });
  }
  return c.json({
    connected: true,
    email: tokens.google_email,
    expiryDate: tokens.expiry_date,
  });
});

// Disconnect Google Calendar
sync.post("/google/disconnect", async (c) => {
  const user = getUser(c);
  await db.execute({
    sql: `DELETE FROM google_calendar_tokens WHERE user_id = ?`,
    args: [user.userId],
  });
  return c.json({ message: "Google Calendar disconnected" });
});

// --- Sync Operations ---

// Push a specific event to Google Calendar
sync.post("/push-event/:eventId", async (c) => {
  const user = getUser(c);
  const { eventId } = c.req.param();

  // Verify the event belongs to the user
  const eventResult = await db.execute({
    sql: `SELECT e.*, c.google_calendar_id FROM events e JOIN calendars c ON e.calendar_id = c.id WHERE e.id = ? AND e.user_id = ?`,
    args: [eventId, user.userId],
  });

  if (!eventResult.rows[0]) {
    return c.json({ error: "Event not found" }, 404);
  }

  const event = eventResult.rows[0] as any;
  const googleCalendarId = event.google_calendar_id || "primary";

  const googleId = await pushEventToGoogle(user.userId, googleCalendarId, {
    title: event.title,
    description: event.description,
    start_time: event.start_time,
    end_time: event.end_time,
    is_all_day: event.is_all_day === 1,
  }, event.google_event_id || undefined);

  if (!googleId) {
    return c.json({ error: "Failed to sync event to Google Calendar" }, 502);
  }

  await markEventSynced(eventId, googleId);
  await recordSync(user.userId, "event", eventId, googleId, "local_to_remote");

  return c.json({ message: "Event synced", googleEventId: googleId });
});

// Pull all events from Google Calendar
sync.post("/pull-events", async (c) => {
  const user = getUser(c);
  const tokens = await getTokens(user.userId);
  if (!tokens) {
    return c.json({ error: "Google Calendar not connected" }, 400);
  }

  const body = await c.req.json().catch(() => ({})) as any;
  const googleCalendarId = body.calendarId || "primary";

  const result = await pullEventsFromGoogle(user.userId, googleCalendarId, body.syncToken);
  if (!result) {
    return c.json({ error: "Failed to pull events from Google Calendar" }, 502);
  }

  // Get user's calendars
  const calendarsResult = await db.execute({
    sql: `SELECT id FROM calendars WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`,
    args: [user.userId],
  });

  let defaultCalendarId: string;
  if (calendarsResult.rows[0]) {
    defaultCalendarId = (calendarsResult.rows[0] as any).id;
  } else {
    // Create a default calendar
    const calId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO calendars (id, user_id, name, color) VALUES (?, ?, 'My Calendar', '#3B82F6')`,
      args: [calId, user.userId],
    });
    defaultCalendarId = calId;
  }

  const imported: any[] = [];

  for (const gEvent of result.events) {
    const g = gEvent as any;

    // Skip events without start/end
    if (!g.start) continue;

    // Check if already imported (by google_event_id)
    const existing = await db.execute({
      sql: `SELECT id FROM events WHERE google_event_id = ? AND user_id = ?`,
      args: [g.id, user.userId],
    });

    if (existing.rows[0]) continue;

    const isAllDay = !!g.start.date;
    const startTime = isAllDay ? `${g.start.date}T00:00:00` : g.start.dateTime;
    const endTime = isAllDay ? `${g.end.date}T23:59:59` : g.end.dateTime;

    const newId = crypto.randomUUID();
    const insertResult = await db.execute({
      sql: `INSERT INTO events (id, calendar_id, user_id, title, description, start_time, end_time, is_all_day, meeting_link, sync_status, google_event_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?) RETURNING *`,
      args: [
        newId, defaultCalendarId, user.userId,
        g.summary || "Untitled Event",
        g.description || "",
        startTime, endTime,
        isAllDay ? 1 : 0,
        g.hangoutLink || null,
        g.id,
      ],
    });

    await recordSync(user.userId, "event", newId, g.id, "remote_to_local");
    imported.push(insertResult.rows[0]);
  }

  return c.json({
    imported: imported.length,
    nextSyncToken: result.nextSyncToken || null,
  });
});

// Full sync (push local unsynced, pull remote)
sync.post("/full-sync", async (c) => {
  const user = getUser(c);
  const tokens = await getTokens(user.userId);
  if (!tokens) {
    return c.json({ error: "Google Calendar not connected" }, 400);
  }

  const results: any = { pushed: 0, pulled: 0, errors: [] };

  // Step 1: Push local unsynced events
  const unsyncedEvents = await db.execute({
    sql: `SELECT e.*, c.name as calendar_name FROM events e JOIN calendars c ON e.calendar_id = c.id
          WHERE e.user_id = ? AND e.sync_status = 'local' AND e.google_event_id IS NULL`,
    args: [user.userId],
  });

  for (const row of unsyncedEvents.rows) {
    const event = row as any;
    try {
      const googleId = await pushEventToGoogle(user.userId, "primary", {
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        is_all_day: event.is_all_day === 1,
      });
      if (googleId) {
        await markEventSynced(event.id, googleId);
        await recordSync(user.userId, "event", event.id, googleId, "local_to_remote");
        results.pushed++;
      } else {
        results.errors.push({ eventId: event.id, error: "Push failed" });
      }
    } catch (err: any) {
      results.errors.push({ eventId: event.id, error: err.message });
    }
  }

  // Step 2: Pull remote events
  try {
    const pullResult = await pullEventsFromGoogle(user.userId, "primary");

    if (pullResult) {
      const calendarsResult = await db.execute({
        sql: `SELECT id FROM calendars WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`,
        args: [user.userId],
      });
      const defaultCalendarId = calendarsResult.rows[0]
        ? (calendarsResult.rows[0] as any).id
        : crypto.randomUUID();

      for (const gEvent of pullResult.events) {
        const g = gEvent as any;
        if (!g.start) continue;

        const existing = await db.execute({
          sql: `SELECT id FROM events WHERE google_event_id = ? AND user_id = ?`,
          args: [g.id, user.userId],
        });
        if (existing.rows[0]) continue;

        const isAllDay = !!g.start.date;
        const startTime = isAllDay ? `${g.start.date}T00:00:00` : g.start.dateTime;
        const endTime = isAllDay ? `${g.end.date}T23:59:59` : g.end.dateTime;

        const newId = crypto.randomUUID();
        await db.execute({
          sql: `INSERT INTO events (id, calendar_id, user_id, title, description, start_time, end_time, is_all_day, sync_status, google_event_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
          args: [
            newId, defaultCalendarId, user.userId,
            g.summary || "Untitled Event",
            g.description || "", startTime, endTime,
            isAllDay ? 1 : 0, g.id,
          ],
        });

        await recordSync(user.userId, "event", newId, g.id, "remote_to_local");
        results.pulled++;
      }
    }
  } catch (err: any) {
    results.errors.push({ phase: "pull", error: err.message });
  }

  return c.json({
    message: "Full sync completed",
    results,
  });
});

export default sync;