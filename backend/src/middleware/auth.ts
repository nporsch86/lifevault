import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import type { JWTPayload } from "jose";

export interface UserPayload extends JWTPayload {
  userId: string;
  email: string;
  subscriptionTier: string;
}

export const secret = new TextEncoder().encode(process.env.JWT_SECRET || "lifevault-dev-secret");

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, secret);
    c.set("user", payload as UserPayload);
    await next();
  } catch (err) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

// Get the authenticated user from the request context
export function getUser(c: any): UserPayload {
  return c.get("user") as UserPayload;
}