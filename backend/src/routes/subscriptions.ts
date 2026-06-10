import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import {
  getConfig,
  createSubscriptionCheckout,
  createOneTimeCheckout,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  verifyWebhookSignature,
  stripe,
} from "../services/stripe.js";
import db from "../db/client.js";

const subscriptions = new Hono();
subscriptions.use("*", authMiddleware);

// --- Configuration ---

// Get Stripe configuration and pricing info
subscriptions.get("/config", async (c) => {
  const config = getConfig();
  return c.json({
    configured: config.configured,
    plans: [
      { id: "monthly", label: "Monthly Premium", price: 7.99, priceId: config.prices.monthly },
      { id: "yearly", label: "Annual Premium", price: 59.99, priceId: config.prices.yearly, savings: "37%" },
      { id: "lifetime", label: "Lifetime Access", price: 149.99, priceId: config.prices.lifetime },
    ],
    templatePrice: { price: 4.99, priceId: config.prices.template },
  });
});

// --- Checkout Sessions ---

// Create subscription checkout (monthly or yearly)
subscriptions.post("/create-checkout", async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const schema = z.object({
      plan: z.enum(["monthly", "yearly", "lifetime"]),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    const { plan, successUrl, cancelUrl } = parsed.data;
    const config = getConfig();

    if (!config.configured) {
      return c.json({ error: "Stripe is not configured" }, 501);
    }

    const priceId = config.prices[plan];
    if (!priceId) {
      return c.json({ error: `No price configured for plan: ${plan}` }, 400);
    }

    let session;
    if (plan === "lifetime") {
      session = await createOneTimeCheckout(user.userId, user.email, priceId, successUrl, cancelUrl, {
        type: "one-time",
        itemType: "lifetime",
      });
    } else {
      session = await createSubscriptionCheckout(user.userId, user.email, priceId, successUrl, cancelUrl);
    }

    if (!session) {
      return c.json({ error: "Failed to create checkout session" }, 500);
    }

    return c.json({ sessionId: session.sessionId, url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create template purchase checkout
subscriptions.post("/buy-template", async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const schema = z.object({
      templateId: z.string().uuid(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    const { templateId, successUrl, cancelUrl } = parsed.data;
    const config = getConfig();

    if (!config.configured) {
      return c.json({ error: "Stripe is not configured" }, 501);
    }

    // Verify template exists and is paid
    const templateResult = await db.execute({
      sql: `SELECT id, name, price FROM templates WHERE id = ? AND type = 'paid'`,
      args: [templateId],
    });

    if (!templateResult.rows[0]) {
      return c.json({ error: "Template not found or is free" }, 404);
    }

    const session = await createOneTimeCheckout(user.userId, user.email, config.prices.template, successUrl, cancelUrl, {
      type: "one-time",
      itemType: "template",
      templateId,
    });

    if (!session) {
      return c.json({ error: "Failed to create checkout session" }, 500);
    }

    return c.json({ sessionId: session.sessionId, url: session.url });
  } catch (err) {
    console.error("Template purchase error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Current Subscription Info ---

subscriptions.get("/my-plan", async (c) => {
  const user = getUser(c);

  // Get user's subscription info
  const userResult = await db.execute({
    sql: `SELECT subscription_tier, email FROM users WHERE id = ?`,
    args: [user.userId],
  });

  if (!userResult.rows[0]) {
    return c.json({ error: "User not found" }, 404);
  }

  const userData = userResult.rows[0] as any;

  // Check if they have a Stripe customer ID
  const customerResult = await db.execute({
    sql: `SELECT stripe_customer_id FROM stripe_customers WHERE user_id = ?`,
    args: [user.userId],
  });

  return c.json({
    tier: userData.subscription_tier,
    features: getFeaturesForTier(userData.subscription_tier),
    stripeCustomerId: (customerResult.rows[0] as any)?.stripe_customer_id || null,
  });
});

function getFeaturesForTier(tier: string): Record<string, boolean> {
  const base = {
    dailyPlanner: true,
    weeklyPlanner: true,
    toDoList: true,
    basicCalendar: true,
  };

  if (tier === "free") return base;

  const premium = {
    ...base,
    monthlyPlanner: true,
    calendarSync: true,
    confidentialCalendar: true,
    cloudBackup: true,
    alerts: true,
    templates: true,
    expenseTracking: true,
  };

  if (tier === "premium") return premium;
  if (tier === "lifetime") return { ...premium, lifetimeAccess: true };

  return base;
}

// --- Webhook ---
// Stripe sends events to this endpoint (no auth — validated by signature)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

subscriptions.post("/webhook", async (c) => {
  if (!webhookSecret) {
    return c.json({ error: "Webhook not configured" }, 501);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  const body = await c.req.text();
  const event = verifyWebhookSignature(body, signature, webhookSecret);

  if (!event) {
    return c.json({ error: "Invalid webhook signature" }, 400);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as any;
        await handleSubscriptionUpdated(deletedSub);
        break;
      }
      case "invoice.payment_succeeded": {
        // Payment confirmed — ensure subscription stays active
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const sub = await stripe?.subscriptions.retrieve(invoice.subscription as string);
          if (sub) {
            await handleSubscriptionUpdated(sub);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  return c.json({ received: true });
});

export default subscriptions;