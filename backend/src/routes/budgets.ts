import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const budgets = new Hono();
budgets.use("*", authMiddleware);

const createBudgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format"),
  amount: z.number().positive("Budget amount must be positive"),
  alert_threshold: z.number().min(0).max(100).optional().default(80),
});

const updateBudgetSchema = createBudgetSchema.partial();

// --- CRUD ---

budgets.get("/", async (c) => {
  const user = getUser(c);
  const month = c.req.query("month");

  let sql = `SELECT * FROM budgets WHERE user_id = ?`;
  const args: any[] = [user.userId];

  if (month) {
    sql += ` AND month = ?`;
    args.push(month);
  }

  sql += ` ORDER BY month DESC, category ASC`;
  const result = await db.execute({ sql, args });

  // Calculate spent for each budget
  const budgetsWithSpent = [];
  for (const row of result.rows) {
    const budget = row as any;
    const [year, monthNum] = budget.month.split("-");
    const startDate = `${budget.month}-01`;
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];

    const spentResult = await db.execute({
      sql: `SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND category = ? AND date >= ? AND date <= ?`,
      args: [user.userId, budget.category, startDate, endDate],
    });

    const spent = (spentResult.rows[0] as any).spent;
    const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

    budgetsWithSpent.push({
      ...budget,
      spent,
      remaining: budget.amount - spent,
      percentage,
      is_over_budget: spent > budget.amount,
      is_approaching_limit: percentage >= budget.alert_threshold,
    });
  }

  return c.json({ budgets: budgetsWithSpent });
});

budgets.get("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `SELECT * FROM budgets WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Budget not found" }, 404);
  return c.json({ budget: result.rows[0] });
});

budgets.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();
  const parsed = createBudgetSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  // Check if budget already exists for this category + month
  const existing = await db.execute({
    sql: `SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?`,
    args: [user.userId, parsed.data.category, parsed.data.month],
  });
  if (existing.rows[0]) {
    return c.json({ error: "Budget already exists for this category and month" }, 409);
  }

  const id = crypto.randomUUID();
  const { category, month, amount, alert_threshold } = parsed.data;
  const result = await db.execute({
    sql: `INSERT INTO budgets (id, user_id, category, month, amount, alert_threshold) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [id, user.userId, category, month, amount, alert_threshold],
  });
  return c.json({ budget: result.rows[0] }, 201);
});

budgets.patch("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = updateBudgetSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const existing = await db.execute({
    sql: `SELECT id FROM budgets WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!existing.rows[0]) return c.json({ error: "Budget not found" }, 404);

  const updates: string[] = [];
  const args: any[] = [];
  const data = parsed.data;

  if (data.category !== undefined) { updates.push("category = ?"); args.push(data.category); }
  if (data.month !== undefined) { updates.push("month = ?"); args.push(data.month); }
  if (data.amount !== undefined) { updates.push("amount = ?"); args.push(data.amount); }
  if (data.alert_threshold !== undefined) { updates.push("alert_threshold = ?"); args.push(data.alert_threshold); }

  if (updates.length === 0) return c.json({ error: "No fields to update" }, 400);
  args.push(id, user.userId);

  const result = await db.execute({
    sql: `UPDATE budgets SET ${updates.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`,
    args,
  });
  return c.json({ budget: result.rows[0] });
});

budgets.delete("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `DELETE FROM budgets WHERE id = ? AND user_id = ? RETURNING id`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Budget not found" }, 404);
  return c.json({ message: "Budget deleted" });
});

// --- Budget vs Actual Summary ---

budgets.get("/summary/:month", async (c) => {
  const user = getUser(c);
  const { month } = c.req.param();

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: "Month must be YYYY-MM format" }, 400);
  }

  const [year, monthNum] = month.split("-");
  const startDate = `${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];

  // Get all budgets for this month
  const budgetsResult = await db.execute({
    sql: `SELECT * FROM budgets WHERE user_id = ? AND month = ? ORDER BY category`,
    args: [user.userId, month],
  });

  // Get actual spending grouped by category
  const actualResult = await db.execute({
    sql: `SELECT category, COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category ORDER BY category`,
    args: [user.userId, startDate, endDate],
  });

  const actualMap = new Map<string, number>();
  for (const row of actualResult.rows) {
    const r = row as any;
    actualMap.set(r.category, r.spent);
  }

  const categories: any[] = [];
  let totalBudget = 0;
  let totalSpent = 0;

  for (const row of budgetsResult.rows) {
    const budget = row as any;
    const spent = actualMap.get(budget.category) || 0;
    totalBudget += budget.amount;
    totalSpent += spent;

    categories.push({
      category: budget.category,
      budgeted: budget.amount,
      spent,
      remaining: budget.amount - spent,
      percentage: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
      alert_threshold: budget.alert_threshold,
      is_over_budget: spent > budget.amount,
      is_approaching_limit: budget.amount > 0 && (spent / budget.amount) * 100 >= budget.alert_threshold,
    });
  }

  // Add unbudgeted categories
  for (const [category, spent] of actualMap) {
    if (!categories.find((c) => c.category === category) && spent > 0) {
      totalSpent += spent;
      categories.push({
        category,
        budgeted: 0,
        spent,
        remaining: -spent,
        percentage: 0,
        is_over_budget: true,
        is_approaching_limit: true,
      });
    }
  }

  return c.json({
    month,
    summary: {
      total_budgeted: totalBudget,
      total_spent: totalSpent,
      total_remaining: totalBudget - totalSpent,
      total_percentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      categories,
    },
  });
});

// --- Alerts: categories approaching budget limit ---

budgets.get("/alerts", async (c) => {
  const user = getUser(c);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const budgetsResult = await db.execute({
    sql: `SELECT * FROM budgets WHERE user_id = ? AND month = ?`,
    args: [user.userId, currentMonth],
  });

  const [year, monthNum] = currentMonth.split("-");
  const startDate = `${currentMonth}-01`;
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];

  const alerts: any[] = [];

  for (const row of budgetsResult.rows) {
    const budget = row as any;
    const spentResult = await db.execute({
      sql: `SELECT COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND category = ? AND date >= ? AND date <= ?`,
      args: [user.userId, budget.category, startDate, endDate],
    });

    const spent = (spentResult.rows[0] as any).spent;
    const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

    if (percentage >= budget.alert_threshold) {
      alerts.push({
        category: budget.category,
        budgeted: budget.amount,
        spent,
        percentage,
        severity: spent > budget.amount ? "over_budget" : "approaching_limit",
        message: spent > budget.amount
          ? `Exceeded ${budget.category} budget by $${(spent - budget.amount).toFixed(2)}`
          : `${budget.category} budget at ${percentage}% (limit: ${budget.alert_threshold}%)`,
      });
    }
  }

  // Check unbudgeted spending
  const unbudgetedResult = await db.execute({
    sql: `SELECT category, COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category`,
    args: [user.userId, startDate, endDate],
  });

  const budgetedCategories = new Set((budgetsResult.rows as any[]).map((r: any) => r.category));
  for (const row of unbudgetedResult.rows) {
    const r = row as any;
    if (!budgetedCategories.has(r.category) && r.spent > 0) {
      alerts.push({
        category: r.category,
        budgeted: 0,
        spent: r.spent,
        percentage: 100,
        severity: "unbudgeted",
        message: `Unbudgeted spending in ${r.category}: $${r.spent.toFixed(2)}`,
      });
    }
  }

  return c.json({ alerts, count: alerts.length });
});

export default budgets;