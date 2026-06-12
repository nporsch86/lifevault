import { Hono } from "hono";
import { cors } from "hono/cors";
import db from "../db/client.js";

const publicRoutes = new Hono();

// Allow CORS for all origins
publicRoutes.use("*", cors({ origin: "*" }));

// Email waitlist signup
publicRoutes.post("/waitlist", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email || !email.includes("@")) {
      return c.json({ error: "Valid email required" }, 400);
    }
    const id = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO waitlist (id, email) VALUES (?, ?)`,
      args: [id, email],
    });
    return c.json({ success: true }, 201);
  } catch (err: any) {
    if (err.message?.includes("UNIQUE")) {
      return c.json({ success: true }); // Already signed up
    }
    console.error("Waitlist error:", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Suggestions
publicRoutes.post("/suggestions", async (c) => {
  try {
    const { suggestion } = await c.req.json();
    if (!suggestion || suggestion.length < 3) {
      return c.json({ error: "Suggestion too short" }, 400);
    }
    const id = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO suggestions (id, content) VALUES (?, ?)`,
      args: [id, suggestion],
    });
    return c.json({ success: true }, 201);
  } catch (err) {
    console.error("Suggestion error:", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

export default publicRoutes;