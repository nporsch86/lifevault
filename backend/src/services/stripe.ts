import Stripe from "stripe";
import db from "../db/client.js";
import { updateSubscription } from "../models/user.js";

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" }) : null;

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "",
  yearly: process.env.STRIPE_PRICE_YEARLY || "",
  lifetime: process.env.STRIPE_PRICE_LIFETIME || "",
  template: process.env.STRIPE_PRICE_TEMPLATE || "",
};

export interface StripeConfig {
  configured: boolean;
  prices: typeof PRICE_IDS;
}

export function getConfig(): StripeConfig {
  return {
    configured: !!stripeKey && !!stripe,
    prices: PRICE_IDS,
  };
}

// --- Subscription Management ---

export interface CheckoutSession {
  sessionId: string;
  url: string | null;
}

// Create a checkout session for subscriptions
export async function createSubscriptionCheckout(
  userId: string,
  userEmail: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession | null> {
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, type: "subscription" },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return null;
  }
}

// Create a checkout session for one-time payment (lifetime, template)
export async function createOneTimeCheckout(
  userId: string,
  userEmail: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string> = {}
): Promise<CheckoutSession | null> {
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, ...metadata },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (err) {
    console.error("Stripe one-time checkout error:", err);
    return null;
  }
}

// --- Webhook Handlers ---

export async function handleCheckoutCompleted(payload: Stripe.CheckoutSession): Promise<void> {
  const userId = payload.metadata?.userId;
  const type = payload.metadata?.type || "subscription";

  if (!userId) {
    console.error("Webhook: No userId in metadata");
    return;
  }

  let tier = "free";

  if (type === "subscription") {
    // Map price ID to tier
    if (payload.metadata?.price === PRICE_IDS.monthly || payload.metadata?.price === PRICE_IDS.yearly) {
      tier = "premium";
    }
  } else if (type === "one-time") {
    const itemType = payload.metadata?.itemType;
    if (itemType === "lifetime") {
      tier = "lifetime";
    }
    // Templates don't change the user's tier
  }

  if (tier !== "free") {
    await updateSubscription(userId, tier);
    console.log(`Upgraded user ${userId} to ${tier}`);
  }
}

export async function handleSubscriptionUpdated(payload: Stripe.Subscription): Promise<void> {
  const userId = payload.metadata?.userId;
  if (!userId) return;

  const status = payload.status;
  if (status === "active" || status === "trialing") {
    await updateSubscription(userId, "premium");
  } else if (status === "canceled" || status === "incomplete_expired" || status === "past_due") {
    await updateSubscription(userId, "free");
  }
}

// --- Portal Session ---
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  } catch (err) {
    console.error("Portal session error:", err);
    return null;
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!stripe) return null;

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return null;
  }
}

export { stripe };