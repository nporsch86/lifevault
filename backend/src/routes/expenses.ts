import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";
import { recordSync } from "../services/sync.js";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { join, extname } from "path";

const expenses = new Hono();
expenses.use("*", authMiddleware);

const UPLOAD_DIR = join(process.cwd(), "uploads", "receipts");

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().optional().default("other"),
  description: z.string().optional().default(""),
  date: z.string(),
  is_recurring: z.boolean().optional().default(false),
  recurring_interval: z.enum(["weekly", "monthly", "yearly"]).optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload dir exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

expenses.get("/", async (c) => {
  const user = getUser(c);
  const category = c.req.query("category");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const recurring = c.req.query("recurring");

  let sql = `SELECT * FROM expenses WHERE user_id = ?`;
  const args: any[] = [user.userId];

  if (category) { sql += ` AND category = ?`; args.push(category); }
  if (from) { sql += ` AND date >= ?`; args.push(from); }
  if (to) { sql += ` AND date <= ?`; args.push(to); }
  if (recurring !== undefined) {
    sql += ` AND is_recurring = ?`;
    args.push(recurring === "true" ? 1 : 0);
  }

  sql += ` ORDER BY date DESC`;
  const result = await db.execute({ sql, args });
  return c.json({ expenses: result.rows });
});

expenses.get("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `SELECT * FROM expenses WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Expense not found" }, 404);
  return c.json({ expense: result.rows[0] });
});

expenses.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const id = crypto.randomUUID();
  const { amount, category, description, date, is_recurring, recurring_interval } = parsed.data;
  const result = await db.execute({
    sql: `INSERT INTO expenses (id, user_id, amount, category, description, date, is_recurring, recurring_interval, original_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      id, user.userId, amount, category, description, date,
      is_recurring ? 1 : 0, recurring_interval || null,
      is_recurring ? date.split("T")[0] : null,
    ],
  });
  return c.json({ expense: result.rows[0] }, 201);
});

expenses.patch("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const existing = await db.execute({
    sql: `SELECT id FROM expenses WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!existing.rows[0]) return c.json({ error: "Expense not found" }, 404);

  const updates: string[] = [];
  const args: any[] = [];
  const data = parsed.data;

  if (data.amount !== undefined) { updates.push("amount = ?"); args.push(data.amount); }
  if (data.category !== undefined) { updates.push("category = ?"); args.push(data.category); }
  if (data.description !== undefined) { updates.push("description = ?"); args.push(data.description); }
  if (data.date !== undefined) { updates.push("date = ?"); args.push(data.date); }
  if (data.is_recurring !== undefined) { updates.push("is_recurring = ?"); args.push(data.is_recurring ? 1 : 0); }
  if (data.recurring_interval !== undefined) { updates.push("recurring_interval = ?"); args.push(data.recurring_interval); }

  if (updates.length === 0) return c.json({ error: "No fields to update" }, 400);
  args.push(id, user.userId);

  const result = await db.execute({
    sql: `UPDATE expenses SET ${updates.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`,
    args,
  });
  return c.json({ expense: result.rows[0] });
});

expenses.delete("/:id", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `DELETE FROM expenses WHERE id = ? AND user_id = ? RETURNING id`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Expense not found" }, 404);
  return c.json({ message: "Expense deleted" });
});

// --- Receipt Upload ---

// Upload a receipt image for an expense
expenses.post("/:id/receipt", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();

  // Verify expense exists and belongs to user
  const expense = await db.execute({
    sql: `SELECT id, receipt_url FROM expenses WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!expense.rows[0]) return c.json({ error: "Expense not found" }, 404);

  try {
    const contentType = c.req.header("Content-Type") || "";

    let filename: string;
    let fileBuffer: Buffer;

    if (contentType.includes("multipart/form-data")) {
      // Parse multipart form data
      const formData = await c.req.parseBody();
      const file = formData["file"] as File | undefined;

      if (!file) return c.json({ error: "No file provided (field name: 'file')" }, 400);

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return c.json({ error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` }, 400);
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return c.json({ error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, 400);
      }

      const ext = extname(file.name) || ".jpg";
      filename = `${id}${ext}`;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      // Direct binary upload (Content-Type: image/*)
      const rawBody = await c.req.arrayBuffer();
      fileBuffer = Buffer.from(rawBody);
      const extFromContentType = contentType.split("/")[1] || "jpg";
      filename = `${id}.${extFromContentType}`;

      if (fileBuffer.length > MAX_FILE_SIZE) {
        return c.json({ error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, 400);
      }
    }

    // Save file to disk
    const filePath = join(UPLOAD_DIR, filename);
    await writeFile(filePath, fileBuffer);

    // Generate URL for the receipt
    const receiptUrl = `/uploads/receipts/${filename}`;

    // Update the expense with receipt_url
    await db.execute({
      sql: `UPDATE expenses SET receipt_url = ? WHERE id = ? AND user_id = ?`,
      args: [receiptUrl, id, user.userId],
    });

    return c.json({
      message: "Receipt uploaded",
      receiptUrl,
    });
  } catch (err) {
    console.error("Receipt upload error:", err);
    return c.json({ error: "Failed to upload receipt" }, 500);
  }
});

// Get receipt URL for an expense
expenses.get("/:id/receipt", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const result = await db.execute({
    sql: `SELECT receipt_url FROM expenses WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!result.rows[0]) return c.json({ error: "Expense not found" }, 404);
  const receiptUrl = (result.rows[0] as any).receipt_url;
  if (!receiptUrl) return c.json({ error: "No receipt attached" }, 404);
  return c.json({ receiptUrl });
});

// Delete receipt for an expense
expenses.delete("/:id/receipt", async (c) => {
  const user = getUser(c);
  const { id } = c.req.param();
  const expense = await db.execute({
    sql: `SELECT receipt_url FROM expenses WHERE id = ? AND user_id = ?`,
    args: [id, user.userId],
  });
  if (!expense.rows[0]) return c.json({ error: "Expense not found" }, 404);

  const receiptUrl = (expense.rows[0] as any).receipt_url;
  if (receiptUrl) {
    const filePath = join(UPLOAD_DIR, receiptUrl.split("/").pop() || "");
    try {
      const { unlink } = await import("fs/promises");
      await unlink(filePath);
    } catch { /* file may not exist */ }
  }

  await db.execute({
    sql: `UPDATE expenses SET receipt_url = NULL WHERE id = ? AND user_id = ?`,
    args: [user.userId, id],
  });

  return c.json({ message: "Receipt deleted" });
});

// Serve receipt files
expenses.get("/file/:filename", async (c) => {
  const { filename } = c.req.param();
  const filePath = join(UPLOAD_DIR, filename);

  // Security: prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return c.json({ error: "Invalid filename" }, 400);
  }

  if (!existsSync(filePath)) {
    return c.json({ error: "File not found" }, 404);
  }

  const fileBuffer = readFileSync(filePath);
  const ext = extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
  };

  return c.newResponse(fileBuffer, 200, {
    "Content-Type": mimeMap[ext] || "application/octet-stream",
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "public, max-age=31536000",
  });
});

// --- Statistics ---

expenses.get("/stats/summary", async (c) => {
  const user = getUser(c);
  const from = c.req.query("from");
  const to = c.req.query("to");

  let sql = `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count, COALESCE(AVG(amount), 0) as average FROM expenses WHERE user_id = ?`;
  const args: any[] = [user.userId];
  if (from) { sql += ` AND date >= ?`; args.push(from); }
  if (to) { sql += ` AND date <= ?`; args.push(to); }

  const result = await db.execute({ sql, args });
  return c.json({ stats: result.rows[0] });
});

expenses.get("/stats/by-category", async (c) => {
  const user = getUser(c);
  const from = c.req.query("from");
  const to = c.req.query("to");

  let sql = `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses WHERE user_id = ?`;
  const args: any[] = [user.userId];
  if (from) { sql += ` AND date >= ?`; args.push(from); }
  if (to) { sql += ` AND date <= ?`; args.push(to); }
  sql += ` GROUP BY category ORDER BY total DESC`;

  const result = await db.execute({ sql, args });
  return c.json({ categories: result.rows });
});

// --- Recurring expense generation ---

expenses.post("/generate-recurring", async (c) => {
  const user = getUser(c);
  const today = new Date().toISOString().split("T")[0];

  const result = await db.execute({
    sql: `SELECT * FROM expenses WHERE user_id = ? AND is_recurring = 1`,
    args: [user.userId],
  });

  const generated: any[] = [];

  for (const row of result.rows) {
    const expense = row as any;
    const lastDate = new Date(expense.date);
    const now = new Date();

    let shouldGenerate = false;
    let nextDate: Date | null = null;

    switch (expense.recurring_interval) {
      case "weekly":
        nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 7);
        if (nextDate <= now) shouldGenerate = true;
        break;
      case "monthly":
        nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (nextDate <= now) shouldGenerate = true;
        break;
      case "yearly":
        nextDate = new Date(lastDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        if (nextDate <= now) shouldGenerate = true;
        break;
    }

    if (shouldGenerate && nextDate) {
      const newId = crypto.randomUUID();
      const dateStr = nextDate.toISOString().split("T")[0];

      const newExpense = await db.execute({
        sql: `INSERT INTO expenses (id, user_id, amount, category, description, date, is_recurring, recurring_interval, original_date)
              VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?) RETURNING *`,
        args: [
          newId, user.userId, expense.amount, expense.category,
          expense.description, dateStr,
          expense.recurring_interval, expense.original_date,
        ],
      });

      await db.execute({
        sql: `INSERT INTO expense_generations (id, expense_id, generated_from_date, generated_to_date)
              VALUES (?, ?, ?, ?)`,
        args: [crypto.randomUUID(), expense.id, expense.date, dateStr],
      });

      await db.execute({
        sql: `UPDATE expenses SET date = ? WHERE id = ?`,
        args: [dateStr, expense.id],
      });

      generated.push(newExpense.rows[0]);
    }
  }

  return c.json({ generated, count: generated.length });
});

export default expenses;