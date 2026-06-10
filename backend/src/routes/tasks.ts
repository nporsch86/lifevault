import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const tasks = new Hono();

// Apply auth to all routes
tasks.use("*", authMiddleware);

// --- Schemas ---
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  due_date: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
  category: z.enum(["work", "personal", "family", "health"]).optional().default("personal"),
  is_recurring: z.boolean().optional().default(false),
  recurring_interval: z.enum(["daily", "weekly", "monthly"]).optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["pending", "completed"]).optional(),
});

// --- List tasks ---
tasks.get("/", async (c) => {
  const user = getUser(c);
  const status = c.req.query("status");
  const category = c.req.query("category");
  const priority = c.req.query("priority");

  let sql = `SELECT * FROM tasks WHERE user_id = ?`;
  const args: any[] = [user.userId];

  if (status) {
    sql += ` AND status = ?`;
    args.push(status);
  }
  if (category) {
    sql += ` AND category = ?`;
    args.push(category);
  }
  if (priority) {
    sql += ` AND priority = ?`;
    args.push(priority);
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await db.execute({ sql, args });
  return c.json({ tasks: result.rows });
});

// --- Get single task ---
tasks.get("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) {
    return c.json({ error: "Task not found" }, 404);
  }
  return c.json({ task: result.rows[0] });
});

// --- Create task ---
tasks.post("/", async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    const id = crypto.randomUUID();
    const { title, description, due_date, priority, category, is_recurring, recurring_interval } = parsed.data;

    const result = await db.execute({
      sql: `INSERT INTO tasks (id, user_id, title, description, due_date, priority, category, is_recurring, recurring_interval, original_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        id, user.userId, title, description, due_date || null,
        priority, category, is_recurring ? 1 : 0,
        recurring_interval || null,
        due_date ? due_date.split("T")[0] : null,
      ],
    });

    return c.json({ task: result.rows[0] }, 201);
  } catch (err) {
    console.error("Create task error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Update task ---
tasks.patch("/:id", async (c) => {
  try {
    const user = getUser(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    // Verify ownership
    const existing = await db.execute({
      sql: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`,
      args: [id, user.userId],
    });
    if (!existing.rows[0]) {
      return c.json({ error: "Task not found" }, 404);
    }

    const updates: string[] = [];
    const args: any[] = [];
    const data = parsed.data;

    if (data.title !== undefined) { updates.push("title = ?"); args.push(data.title); }
    if (data.description !== undefined) { updates.push("description = ?"); args.push(data.description); }
    if (data.due_date !== undefined) { updates.push("due_date = ?"); args.push(data.due_date); }
    if (data.priority !== undefined) { updates.push("priority = ?"); args.push(data.priority); }
    if (data.status !== undefined) { updates.push("status = ?"); args.push(data.status); }
    if (data.category !== undefined) { updates.push("category = ?"); args.push(data.category); }
    if (data.is_recurring !== undefined) { updates.push("is_recurring = ?"); args.push(data.is_recurring ? 1 : 0); }
    if (data.recurring_interval !== undefined) { updates.push("recurring_interval = ?"); args.push(data.recurring_interval); }

    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    updates.push("updated_at = datetime('now')");
    args.push(id, user.userId);

    const result = await db.execute({
      sql: `UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`,
      args,
    });

    return c.json({ task: result.rows[0] });
  } catch (err) {
    console.error("Update task error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Delete task ---
tasks.delete("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `DELETE FROM tasks WHERE id = ? AND user_id = ? RETURNING id`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) {
    return c.json({ error: "Task not found" }, 404);
  }
  return c.json({ message: "Task deleted" });
});

// --- Auto-rollover: roll pending overdue tasks ---
tasks.post("/rollover", async (c) => {
  const user = getUser(c);
  const today = new Date().toISOString().split("T")[0];

  // Find all pending tasks with due_date before today
  const overdue = await db.execute({
    sql: `SELECT * FROM tasks WHERE user_id = ? AND status = 'pending' AND due_date < ?`,
    args: [user.userId, today],
  });

  const rolled: any[] = [];

  for (const task of overdue.rows) {
    const t = task as any;
    const oldId = t.id;

    // Create new task with today's date
    const newId = crypto.randomUUID();
    const newTask = await db.execute({
      sql: `INSERT INTO tasks (id, user_id, title, description, due_date, priority, category, is_recurring, recurring_interval, original_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending') RETURNING *`,
      args: [
        newId, user.userId, t.title, t.description, today,
        t.priority, t.category, t.is_recurring, t.recurring_interval,
        t.original_date || today,
      ],
    });

    // Mark old task as rolled
    await db.execute({
      sql: `UPDATE tasks SET status = 'rolled', updated_at = datetime('now') WHERE id = ?`,
      args: [oldId],
    });

    // Track rollover
    const rolloverId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO task_rollovers (id, task_id, rolled_from_date, rolled_to_date) VALUES (?, ?, ?, ?)`,
      args: [rolloverId, oldId, t.due_date, today],
    });

    rolled.push(newTask.rows[0]);
  }

  return c.json({ rolled, count: rolled.length });
});

export default tasks;