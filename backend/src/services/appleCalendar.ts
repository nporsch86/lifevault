import db from "../db/client.js";
import { recordSync } from "./sync.js";

const CALDAV_PORT = 8443; // Standard CalDAV SSL port

export interface CalDAVCalendar {
  href: string;
  displayName: string;
  color?: string;
  ctag?: string;
  syncToken?: string;
}

export interface CalDAVEvent {
  href: string;
  etag: string;
  icalData: string;
}

export interface CalDAVToken {
  id: string;
  user_id: string;
  server_url: string;
  username: string;
  password: string; // app-specific password
  principal_url: string | null;
  created_at: string;
}

// --- Token Management ---

export async function storeCalDAVTokens(
  userId: string,
  serverUrl: string,
  username: string,
  password: string
): Promise<void> {
  // Remove old tokens first
  await db.execute({
    sql: `DELETE FROM apple_caldav_tokens WHERE user_id = ?`,
    args: [userId],
  });

  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO apple_caldav_tokens (id, user_id, server_url, username, password)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, userId, serverUrl, username, password],
  });
}

export async function getCalDAVTokens(userId: string): Promise<CalDAVToken | null> {
  const result = await db.execute({
    sql: `SELECT * FROM apple_caldav_tokens WHERE user_id = ?`,
    args: [userId],
  });
  return (result.rows[0] as unknown as CalDAVToken) || null;
}

export async function deleteCalDAVTokens(userId: string): Promise<void> {
  await db.execute({
    sql: `DELETE FROM apple_caldav_tokens WHERE user_id = ?`,
    args: [userId],
  });
}

// --- Authentication header ---
function authHeader(username: string, password: string): string {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

// --- CalDAV XML builders ---

function propfindRequestBody(props: string[]): string {
  const propXml = props.map((p) => `<D:${p}/>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    ${propXml}
  </D:prop>
</D:propfind>`;
}

function calendarQueryRequestBody(fromDate: string, toDate: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${fromDate}" end="${toDate}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
}

// --- CalDAV API calls ---

// Discover calendars via PROPFIND on the principal URL
export async function discoverCalendars(
  serverUrl: string,
  username: string,
  password: string
): Promise<CalDAVCalendar[]> {
  const auth = authHeader(username, password);

  try {
    // Step 1: Get principal URL
    const principalResponse = await fetch(serverUrl.replace(/\/$/, ""), {
      method: "PROPFIND",
      headers: {
        Authorization: auth,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: "0",
      },
      body: propfindRequestBody(["current-user-principal", "displayname", "resourcetype"]),
    });

    if (!principalResponse.ok) {
      console.error("PROPFIND failed (status", principalResponse.status, ")");
      return [];
    }

    const principalText = await principalResponse.text();
    const principalMatch = principalText.match(/<D:current-user-principal>.*?<D:href>(.*?)<\/D:href>.*?<\/D:current-user-principal>/s);
    const principalUrl = principalMatch ? principalMatch[1] : "/";

    // Step 2: Get calendar-home-set from principal
    const fullPrincipalUrl = new URL(principalUrl, serverUrl).href;
    const homeResponse = await fetch(fullPrincipalUrl, {
      method: "PROPFIND",
      headers: {
        Authorization: auth,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: "0",
      },
      body: propfindRequestBody(["calendar-home-set", "displayname", "resourcetype"]),
    });

    if (!homeResponse.ok) return [];

    const homeText = await homeResponse.text();
    const homeSetMatch = homeText.match(/<C:calendar-home-set>.*?<D:href>(.*?)<\/D:href>.*?<\/C:calendar-home-set>/s);
    const calendarHomeSet = homeSetMatch ? homeSetMatch[1] : null;

    if (!calendarHomeSet) return [];

    // Step 3: List calendars from calendar-home-set
    const calendarHomeUrl = new URL(calendarHomeSet, serverUrl).href;
    const calendarsResponse = await fetch(calendarHomeUrl, {
      method: "PROPFIND",
      headers: {
        Authorization: auth,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: "1",
      },
      body: propfindRequestBody(["displayname", "resourcetype", "getctag", "calendar-color"]),
    });

    if (!calendarsResponse.ok) return [];

    const calendarsText = await calendarsResponse.text();

    // Parse out calendar resources
    const calendars: CalDAVCalendar[] = [];
    const responseMatches = calendarsText.matchAll(/<D:response>.*?<\/D:response>/gs);

    for (const match of responseMatches) {
      const resp = match[0];

      // Skip non-calendar resources
      if (!resp.includes("calendar</D:resourcetype>") &&
          !resp.includes("calendar</C:resourcetype>")) continue;

      const hrefMatch = resp.match(/<D:href>(.*?)<\/D:href>/);
      const nameMatch = resp.match(/<D:displayname>(.*?)<\/D:displayname>/);
      const ctagMatch = resp.match(/<CS:getctag.*?>(.*?)<\/CS:getctag>/s) || resp.match(/<D:getctag.*?>(.*?)<\/D:getctag>/s);
      const colorMatch = resp.match(/<CS:calendar-color.*?>(.*?)<\/CS:calendar-color>/s) || resp.match(/<APPLE:calendar-color.*?>(.*?)<\/APPLE:calendar-color>/s);

      if (hrefMatch) {
        calendars.push({
          href: decodeURIComponent(hrefMatch[1]),
          displayName: nameMatch ? decodeURIComponent(nameMatch[1]) : "Calendar",
          color: colorMatch ? colorMatch[1] : undefined,
          ctag: ctagMatch ? ctagMatch[1] : undefined,
        });
      }
    }

    return calendars;
  } catch (err) {
    console.error("CalDAV discovery error:", err);
    return [];
  }
}

// Fetch events from a calendar via calendar-query REPORT
export async function fetchEvents(
  baseUrl: string,
  calendarHref: string,
  username: string,
  password: string,
  fromDate?: string,
  toDate?: string
): Promise<CalDAVEvent[]> {
  const auth = authHeader(username, password);
  const calendarUrl = new URL(calendarHref, baseUrl).href;

  const from = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const to = toDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  try {
    const response = await fetch(calendarUrl, {
      method: "REPORT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: "1",
      },
      body: calendarQueryRequestBody(from, to),
    });

    if (!response.ok) {
      console.error("CalDAV REPORT failed:", response.status);
      return [];
    }

    const text = await response.text();
    const events: CalDAVEvent[] = [];

    const responseMatches = text.matchAll(/<D:response>.*?<\/D:response>/gs);
    for (const match of responseMatches) {
      const resp = match[0];
      const hrefMatch = resp.match(/<D:href>(.*?)<\/D:href>/);
      const etagMatch = resp.match(/<D:getetag>(.*?)<\/D:getetag>/);
      const icalMatch = resp.match(/<C:calendar-data>(.*?)<\/C:calendar-data>/s);

      if (hrefMatch && icalMatch) {
        events.push({
          href: decodeURIComponent(hrefMatch[1]),
          etag: etagMatch ? etagMatch[1] : "",
          icalData: icalMatch[1].trim(),
        });
      }
    }

    return events;
  } catch (err) {
    console.error("CalDAV fetch error:", err);
    return [];
  }
}

// Create/update an event via PUT
export async function putEvent(
  baseUrl: string,
  calendarHref: string,
  eventHref: string,
  icalData: string,
  username: string,
  password: string
): Promise<string | null> {
  const auth = authHeader(username, password);
  const eventUrl = new URL(eventHref, new URL(calendarHref, baseUrl).href).href;

  try {
    const response = await fetch(eventUrl, {
      method: "PUT",
      headers: {
        Authorization: auth,
        "Content-Type": "text/calendar; charset=utf-8",
      },
      body: icalData,
    });

    if (!response.ok) {
      console.error("CalDAV PUT failed:", response.status);
      return null;
    }

    const etag = response.headers.get("ETag") || response.headers.get("etag");
    return etag;
  } catch (err) {
    console.error("CalDAV PUT error:", err);
    return null;
  }
}

// Delete an event via DELETE
export async function deleteEvent(
  baseUrl: string,
  eventHref: string,
  username: string,
  password: string
): Promise<boolean> {
  const auth = authHeader(username, password);
  const eventUrl = new URL(eventHref, baseUrl).href;

  try {
    const response = await fetch(eventUrl, {
      method: "DELETE",
      headers: { Authorization: auth },
    });
    return response.ok || response.status === 404;
  } catch (err) {
    console.error("CalDAV DELETE error:", err);
    return false;
  }
}

// --- iCalendar (iCal) parsing helpers ---

export function parseICalEvent(icalData: string): {
  uid: string;
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
} | null {
  try {
    const uidMatch = icalData.match(/^UID:(.*)$/m);
    const summaryMatch = icalData.match(/^SUMMARY:(.*)$/m);
    const descMatch = icalData.match(/^DESCRIPTION:(.*)$/m);
    const dtStartMatch = icalData.match(/^DTSTART(;VALUE=DATE)?:?(.*)$/m);
    const dtEndMatch = icalData.match(/^DTEND(;VALUE=DATE)?:?(.*)$/m);

    if (!uidMatch || !dtStartMatch) return null;

    const isAllDay = dtStartMatch[1] === ";VALUE=DATE";
    let startTime: string;
    let endTime: string;

    if (isAllDay) {
      // Date format: 20260610
      const d = dtStartMatch[2].trim();
      startTime = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00`;
      const e = dtEndMatch ? dtEndMatch[2].trim() : d;
      endTime = `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}T23:59:59`;
    } else {
      // DateTime format: 20260610T120000Z
      const s = dtStartMatch[2].trim().replace("Z", "");
      startTime = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}`;
      if (dtEndMatch) {
        const e = dtEndMatch[2].trim().replace("Z", "");
        endTime = `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}T${e.slice(9, 11)}:${e.slice(11, 13)}:${e.slice(13, 15)}`;
      } else {
        endTime = startTime;
      }
    }

    return {
      uid: uidMatch[1].trim(),
      summary: summaryMatch ? summaryMatch[1].trim() : "Untitled Event",
      description: descMatch ? descMatch[1].trim().replace(/\\n/g, "\n") : "",
      startTime,
      endTime,
      isAllDay,
    };
  } catch (err) {
    console.error("iCal parse error:", err);
    return null;
  }
}

// Build iCal data for a Lifevault event
export function buildICalEvent(
  uid: string,
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  isAllDay: boolean
): string {
  const fmt = (d: string) => d.replace(/[-:]/g, "").replace(/\.\d+/, "");
  const dtStart = isAllDay ? `;VALUE=DATE:${startTime.split("T")[0].replace(/-/g, "")}` : `:${fmt(startTime)}Z`;
  const dtEnd = isAllDay ? `;VALUE=DATE:${endTime.split("T")[0].replace(/-/g, "")}` : `:${fmt(endTime)}Z`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lifevault//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART${dtStart}`,
    `DTEND${dtEnd}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}