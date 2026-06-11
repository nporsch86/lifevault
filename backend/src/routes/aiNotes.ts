import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getUser } from "../middleware/auth.js";
import db from "../db/client.js";

const aiNotes = new Hono();
aiNotes.use("*", authMiddleware);

// Check if user has premium subscription
async function checkPremium(userId: string): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT subscription_tier FROM users WHERE id = ?`,
    args: [userId],
  });
  const tier = (result.rows[0] as any)?.subscription_tier;
  return tier === "premium" || tier === "lifetime";
}

const summarizeSchema = z.object({
  noteId: z.string().uuid("Invalid note ID").optional(),
  content: z.string().min(10, "Content must be at least 10 characters").optional(),
});

// Summarize a meeting note
aiNotes.post("/summarize", async (c) => {
  try {
    const user = getUser(c);

    // Check premium
    const isPremium = await checkPremium(user.userId);
    if (!isPremium) {
      return c.json({ error: "Premium subscription required for AI summarization" }, 403);
    }

    const body = await c.req.json();
    const parsed = summarizeSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }

    let content = parsed.data.content;

    // If noteId provided, load content from DB
    if (parsed.data.noteId && !content) {
      const noteResult = await db.execute({
        sql: `SELECT content, title FROM notes WHERE id = ? AND user_id = ?`,
        args: [parsed.data.noteId, user.userId],
      });
      if (!noteResult.rows[0]) return c.json({ error: "Note not found" }, 404);
      const note = noteResult.rows[0] as any;
      content = `Title: ${note.title}\n\n${note.content}`;
    }

    if (!content || content.length < 10) {
      return c.json({ error: "Content must be at least 10 characters" }, 400);
    }

    // Call AI/LLM API for summarization
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";

    if (!apiKey) {
      // Return mock/demo summarization when no API key is configured
      const mockSummary = generateMockSummary(content);
      return c.json({
        premium: true,
        summary: mockSummary.summary,
        action_items: mockSummary.actionItems,
        key_points: mockSummary.keyPoints,
        source: "demo",
      });
    }

    // Real API call
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a meeting note summarizer. Analyze the following meeting notes and provide:
1. A concise summary (2-3 sentences)
2. Action items (as a list)
3. Key points (as a list)

Format your response as JSON with keys: summary, action_items (array), key_points (array)`,
          },
          { role: "user", content },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("LLM API error:", await response.text());
      return c.json({ error: "AI summarization service unavailable" }, 502);
    }

    const data = await response.json() as any;
    let result;
    try {
      result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch {
      result = { summary: content.slice(0, 200) + "...", action_items: [], key_points: [] };
    }

    return c.json({
      premium: true,
      summary: result.summary || "Summary not available",
      action_items: result.action_items || [],
      key_points: result.key_points || [],
      source: "ai",
    });
  } catch (err) {
    console.error("AI summarization error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Generate mock summary for demo purposes
function generateMockSummary(content: string) {
  const sentences = content.split(/[.!?\n]+/).filter((s) => s.trim().length > 0);
  const summary = sentences.slice(0, 3).join(". ") + ".";
  const keyPoints = sentences.slice(0, 5).map((s) => s.trim()).filter((s) => s.length > 10);

  // Extract potential action items (lines with action verbs)
  const actionVerbs = ["need to", "should", "will", "must", "please", "follow up", "send", "create", "schedule", "review", "update", "complete"];
  const actionItems: string[] = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase().trim();
    if (actionVerbs.some((v) => lower.includes(v)) && sentence.length > 15) {
      actionItems.push(sentence.trim());
    }
  }

  return {
    summary: summary || "Meeting notes summarized.",
    actionItems: actionItems.slice(0, 5),
    keyPoints: keyPoints.slice(0, 5),
  };
}

export default aiNotes;