import db from "../db/client.js";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

export interface MicrosoftToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expiry_date: string;
  microsoft_email: string | null;
}

// --- Token Management ---

export async function storeTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: string,
  email?: string
): Promise<void> {
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO microsoft_calendar_tokens (id, user_id, access_token, refresh_token, expiry_date, microsoft_email)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id)
          DO UPDATE SET access_token = ?, refresh_token = ?, expiry_date = ?, microsoft_email = COALESCE(?, microsoft_email), updated_at = ?`,
    args: [
      id, userId, accessToken, refreshToken, expiryDate, email || null,
      accessToken, refreshToken, expiryDate, email || null, new Date().toISOString(),
    ],
  });
}

export async function getTokens(userId: string): Promise<MicrosoftToken | null> {
  const result = await db.execute({
    sql: `SELECT * FROM microsoft_calendar_tokens WHERE user_id = ?`,
    args: [userId],
  });
  return (result.rows[0] as unknown as MicrosoftToken) || null;
}

export async function deleteTokens(userId: string): Promise<void> {
  await db.execute({
    sql: `DELETE FROM microsoft_calendar_tokens WHERE user_id = ?`,
    args: [userId],
  });
}

// --- OAuth Flow ---

export function getAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const url = new URL(MICROSOFT_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "Calendars.ReadWrite offline_access User.Read");
  url.searchParams.set("state", state);
  url.searchParams.set("response_mode", "query");
  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiryDate: string } | null> {
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error("MS token exchange failed:", await response.text());
      return null;
    }

    const data = await response.json() as any;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    };
  } catch (err) {
    console.error("MS token exchange error:", err);
    return null;
  }
}

export async function refreshAccessToken(
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const tokens = await getTokens(userId);
  if (!tokens?.refresh_token) return null;

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    });

    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error("MS token refresh failed:", await response.text());
      return null;
    }

    const data = await response.json() as any;
    const newExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
    const newRefresh = data.refresh_token || tokens.refresh_token;

    await storeTokens(userId, data.access_token, newRefresh, newExpiry);
    return data.access_token;
  } catch (err) {
    console.error("MS token refresh error:", err);
    return null;
  }
}

export async function getValidAccessToken(
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const tokens = await getTokens(userId);
  if (!tokens) return null;

  const expiryTime = new Date(tokens.expiry_date).getTime();
  if (expiryTime - 300000 < Date.now()) {
    return await refreshAccessToken(userId, clientId, clientSecret);
  }

  return tokens.access_token;
}

// --- Microsoft Graph API Calls ---

export interface OutlookCalendar {
  id: string;
  name: string;
  color?: string;
  canEdit?: boolean;
}

export async function getUserProfile(accessToken: string): Promise<{ email: string; name: string } | null> {
  try {
    const response = await fetch(`${GRAPH_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    return { email: data.mail || data.userPrincipalName || "", name: data.displayName || "" };
  } catch {
    return null;
  }
}

export async function listCalendars(accessToken: string): Promise<OutlookCalendar[]> {
  try {
    const response = await fetch(`${GRAPH_API_BASE}/me/calendars`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error("List calendars failed:", await response.text());
      return [];
    }
    const data = await response.json() as any;
    return (data.value || []).map((cal: any) => ({
      id: cal.id,
      name: cal.name || "Calendar",
      color: cal.color || null,
      canEdit: cal.canEdit || true,
    }));
  } catch (err) {
    console.error("List calendars error:", err);
    return [];
  }
}

export interface OutlookEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isAllDay?: boolean;
  webLink?: string;
  onlineMeetingUrl?: string;
}

export async function listEvents(
  accessToken: string,
  calendarId: string,
  startDate?: string,
  endDate?: string
): Promise<OutlookEvent[]> {
  try {
    const url = new URL(`${GRAPH_API_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set("$top", "100");
    url.searchParams.set("$orderby", "start/dateTime asc");

    if (startDate) url.searchParams.set("startDateTime", startDate);
    if (endDate) url.searchParams.set("endDateTime", endDate);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("List events failed:", await response.text());
      return [];
    }

    const data = await response.json() as any;
    return (data.value || []).map((ev: any) => ({
      id: ev.id,
      subject: ev.subject || "Untitled Event",
      bodyPreview: ev.bodyPreview || "",
      start: ev.start,
      end: ev.end,
      isAllDay: ev.isAllDay || false,
      webLink: ev.webLink,
      onlineMeetingUrl: ev.onlineMeetingUrl,
    }));
  } catch (err) {
    console.error("List events error:", err);
    return [];
  }
}

// Create an event in Outlook
export async function createEvent(
  accessToken: string,
  calendarId: string,
  eventData: {
    subject: string;
    body?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    isAllDay?: boolean;
  }
): Promise<string | null> {
  try {
    const body: any = {
      subject: eventData.subject,
      start: eventData.start,
      end: eventData.end,
      isAllDay: eventData.isAllDay || false,
    };
    if (eventData.body) {
      body.body = { contentType: "text", content: eventData.body };
    }

    const response = await fetch(
      `${GRAPH_API_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.error("Create event failed:", await response.text());
      return null;
    }

    const data = await response.json() as any;
    return data.id;
  } catch (err) {
    console.error("Create event error:", err);
    return null;
  }
}

// Update an event in Outlook
export async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  eventData: {
    subject?: string;
    body?: string;
    start?: { dateTime: string; timeZone: string };
    end?: { dateTime: string; timeZone: string };
    isAllDay?: boolean;
  }
): Promise<boolean> {
  try {
    const body: any = {};
    if (eventData.subject) body.subject = eventData.subject;
    if (eventData.start) body.start = eventData.start;
    if (eventData.end) body.end = eventData.end;
    if (eventData.isAllDay !== undefined) body.isAllDay = eventData.isAllDay;
    if (eventData.body) body.body = { contentType: "text", content: eventData.body };

    const response = await fetch(
      `${GRAPH_API_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.error("Update event failed:", await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Update event error:", err);
    return false;
  }
}

// Delete an event in Outlook
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.ok || response.status === 404;
  } catch (err) {
    console.error("Delete event error:", err);
    return false;
  }
}