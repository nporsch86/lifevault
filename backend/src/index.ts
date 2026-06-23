import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import dotenv from "dotenv";
dotenv.config();

import { runMigrations } from "./db/migrate.js";
import authRoutes from "./routes/auth.js";
import tasksRoutes from "./routes/tasks.js";
import eventsRoutes from "./routes/events.js";
import calendarsRoutes from "./routes/calendars.js";
import expensesRoutes from "./routes/expenses.js";
import linksRoutes from "./routes/links.js";
import notesRoutes from "./routes/notes.js";
import templatesRoutes from "./routes/templates.js";
import syncRoutes from "./routes/sync.js";
import appleSyncRoutes from "./routes/appleSync.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import outlookSyncRoutes from "./routes/outlookSync.js";
import budgetsRoutes from "./routes/budgets.js";
import aiNotesRoutes from "./routes/aiNotes.js";
import publicRoutes from "./routes/public.js";
import sharingRoutes from "./routes/sharing.js";
import syncStateRoutes from "./routes/syncState.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
}));

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/tasks", tasksRoutes);
app.route("/api/events", eventsRoutes);
app.route("/api/calendars", calendarsRoutes);
app.route("/api/expenses", expensesRoutes);
app.route("/api/links", linksRoutes);
app.route("/api/notes", notesRoutes);
app.route("/api/templates", templatesRoutes);
app.route("/api/sync", syncRoutes);
app.route("/api/apple-calendar", appleSyncRoutes);
app.route("/api/subscriptions", subscriptionsRoutes);
app.route("/api/outlook", outlookSyncRoutes);
app.route("/api/budgets", budgetsRoutes);
app.route("/api/ai-notes", aiNotesRoutes);
app.route("/api/sharing", sharingRoutes);
app.route("/api/sync-state", syncStateRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const PORT = parseInt(process.env.PORT || "3001", 10);

// Run migrations then start server
runMigrations()
  .then(() => {
    serve({
      fetch: app.fetch,
      port: PORT,
    });
    console.log(`🚀 Lifevault API running on http://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });

export default app;app.route("/api", publicRoutes);
