import db from "../db/client.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface GoogleToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expiry_date: string;
  google_email: string | null;
}

// Store Google OAuth tokens
export async function storeTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: string,
  googleEmail?: string
): Promise<void> {
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO google_calendar_tokens (id, user_id, access_token, refresh_token, expiry_date, google_email)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id)
          DO UPDATE SET access_token = ?, refresh_token = ?, expiry_date = ?, google_email = COALESCE(?, google_email), updated_at = ?`,
    args: [
      id, userId, accessToken, refreshToken, expiryDate, googleEmail || null,
      accessToken, refreshToken, expiryDate, googleEmail || null, new Date().toISOString(),
    ],
  });
}

// Get stored tokens
export async function getTokens(userId: string): Promise<GoogleToken | null> {
  const result = await db.execute({
    sql: `SELECT * FROM google_calendar_tokens WHERE user_id = ?`,
    args: [userId],
  });
  return (result.rows[0] as unknown as GoogleToken) || null;
}

// Refresh access token using refresh token
export async function refreshAccessToken(userId: string): Promise<string | null> {
  const tokens = await getTokens(userId);
  if (!tokens?.refresh_token) return null;

  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", await response.text());
      return null;
    }

    const data = await response.json() as any;
    const newExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

    await storeTokens(userId, data.access_token, tokens.refresh_token, newExpiry);
    return data.access_token;
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
}

// Get valid access token (auto-refresh if needed)
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = await getTokens(userId);
  if (!tokens) return null;

  // Check if expired (with 5 min buffer)
  const expiryTime = new Date(tokens.expiry_date).getTime();
  if (expiryTime - 300000 < Date.now()) {
    return await refreshAccessToken(userId);
  }

  return tokens.access_token;
}

// Google Calendar API helpers

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
}

// Push a Lifevault event to Google Calendar
export async function pushEventToGoogle(
  userId: string,
  calendarId: string,
  event: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    is_all_day: boolean;
  },
  googleEventId?: string
): Promise<string | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return null;

  const googleEvent: Partial<GoogleCalendarEvent> = {
    summary: event.title,
    description: event.description || "",
  };

  if (event.is_all_day) {
    googleEvent.start = { date: event.start_time.split("T")[0] };
    googleEvent.end = { date: event.end_time.split("T")[0] };
  } else {
    googleEvent.start = { dateTime: event.start_time, timeZone: "UTC" };
    googleEvent.end = { dateTime: event.end_time, timeZone: "UTC" };
  }

  const url = googleEventId
    ? `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`
    : `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`;

  try {
    const response = await fetch(url, {
      method: googleEventId ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEvent),
    });

    if (!response.ok) {
      console.error("Google Calendar API error:", await response.text());
      return null;
    }

    const data = await response.json() as any;
    return data.id;
  } catch (err) {
    console.error("Google Calendar push error:", err);
    return null;
  }
}

// Pull events from Google Calendar
export async function pullEventsFromGoogle(
  userId: string,
  calendarId: string,
  syncToken?: string
): Promise<{ events: GoogleCalendarEvent[]; nextSyncToken?: string } | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return null;

  let url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`;
  if (syncToken) {
    url += `?syncToken=${syncToken}`;
  } else {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    url += `?timeMin=${oneMonthAgo}`;
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("Google Calendar pull error:", await response.text());
      return null;
    }

    const data = await response.json() as any;
    return {
      events: data.items || [],
      nextSyncToken: data.nextSyncToken,
    };
  } catch (err) {
    console.error("Google Calendar pull error:", err);
    return null;
  }
}

// Delete an event from Google Calendar
export async function deleteGoogleEvent(
  userId: string,
  calendarId: string,
  googleEventId: string
): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return false;

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.ok || response.status === 410;
  } catch (err) {
    console.error("Google Calendar delete error:", err);
    return false;
  }
}