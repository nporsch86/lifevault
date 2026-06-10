import db from "../db/client.js";
import type { UserPayload } from "../middleware/auth.js";

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  subscription_tier: string;
  biometric_enabled: number;
}

export async function createUser(id: string, email: string, name: string, passwordHash: string): Promise<User> {
  const result = await db.execute({
    sql: `INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?) RETURNING *`,
    args: [id, email, name, passwordHash],
  });
  return result.rows[0] as unknown as User;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db.execute({
    sql: `SELECT * FROM users WHERE email = ?`,
    args: [email],
  });
  return (result.rows[0] as unknown as User) || null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await db.execute({
    sql: `SELECT id, email, name, created_at, subscription_tier, biometric_enabled FROM users WHERE id = ?`,
    args: [id],
  });
  return (result.rows[0] as unknown as User) || null;
}

export async function updateSubscription(userId: string, tier: string): Promise<void> {
  await db.execute({
    sql: `UPDATE users SET subscription_tier = ? WHERE id = ?`,
    args: [tier, userId],
  });
}