import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createUser, findUserByEmail, findUserById } from "../models/user.js";
import { secret, authMiddleware, getUser } from "../middleware/auth.js";

const auth = new Hono();

// --- Schemas ---
const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// --- Signup ---
auth.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    const { email, password, name } = parsed.data;

    // Check if user exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const id = crypto.randomUUID();
    const user = await createUser(id, email, name, passwordHash);

    // Generate JWT
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscription_tier,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
      },
    }, 201);
  } catch (err) {
    console.error("Signup error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Login ---
auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Generate JWT
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscription_tier,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Profile (protected) ---
auth.get("/me", authMiddleware, async (c) => {
  const user = getUser(c);
  const profile = await findUserById(user.userId);
  if (!profile) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({ user: profile });
});

export default auth;