import { Hono } from "hono";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const syncState = new Hono();
syncState.use("*", authMiddleware);

// Save planner state
syncState.post("/planner-state", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();
  const stateData = JSON.stringify(body);

  await db.execute({
    sql: `INSERT INTO planner_state (user_id, state_data, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(user_id) DO UPDATE SET state_data = ?, updated_at = datetime('now')`,
    args: [user.userId, stateData, stateData],
  });

  return c.json({ success: true });
});

// Load planner state
syncState.get("/planner-state", async (c) => {
  const user = getUser(c);
  const result = await db.execute({
    sql: `SELECT state_data FROM planner_state WHERE user_id = ?`,
    args: [user.userId],
  });

  if (!result.rows[0]) {
    return c.json({ state: null });
  }

  try {
    const row = result.rows[0] as { state_data: string };
    const state = JSON.parse(row.state_data);
    return c.json({ state });
  } catch {
    return c.json({ state: null });
  }
});

export default syncState;