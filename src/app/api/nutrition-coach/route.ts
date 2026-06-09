import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

/** Extract a JSON object from text that may be wrapped in markdown fences */
function extractJSON(text: string): string {
  // Strip ```json ... ``` or ``` ... ``` wrappers if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Find first { ... } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it in Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  const { entries, userName, latestWeight } = await req.json();

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "No food entries provided" }, { status: 400 });
  }

  const logText = entries
    .map((e: { date: string; time: string; mealType: string; name: string; quantity?: string; notes?: string }) =>
      `${e.date} ${e.time} [${e.mealType}] ${e.name}${e.quantity ? ` (${e.quantity})` : ""}${e.notes ? ` — note: ${e.notes}` : ""}`
    )
    .join("\n");

  const prompt = `You are a professional sports nutritionist and fitness coach. Analyse the food log below for ${userName || "an athlete"} who weighs ${latestWeight ? `${latestWeight} kg` : "an unknown weight"} and follows a 6-day progressive strength training programme (biceps focus, upper body, cardio HIIT, legs & shoulders, recovery days). The person is based in India.

FOOD LOG (last ${entries.length} entries, oldest first):
${logText}

Give detailed, personalised, realistic nutrition coaching based on Indian food culture. Return ONLY a raw JSON object — no markdown, no explanation outside the JSON. Schema:

{
  "overallSummary": "2-3 sentence honest assessment of overall eating pattern",
  "patterns": ["observed pattern 1", ...],
  "concerns": ["concern 1", ...],
  "suggestions": ["actionable suggestion 1", ...],
  "recommendedFoods": [
    { "name": "food name", "reason": "why it helps for this person", "howToEat": "timing / prep tip" }
  ],
  "recipes": [
    {
      "name": "recipe name",
      "ingredients": ["item 1", "item 2"],
      "steps": ["step 1", "step 2"],
      "nutritionNote": "key benefit",
      "bestFor": "best time or purpose"
    }
  ]
}

Include: 3-5 patterns, 2-4 concerns, 4-6 suggestions, 4-6 recommended foods, 2-3 recipes.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    const rawText = await res.text();

    if (!res.ok) {
      let friendly = `Gemini returned HTTP ${res.status}.`;
      try {
        const errJson = JSON.parse(rawText);
        const msg = errJson?.error?.message;
        if (msg) friendly = msg;
      } catch { /* ignore */ }
      console.error("Gemini API error:", rawText);
      return NextResponse.json({ error: friendly }, { status: 502 });
    }

    const data = JSON.parse(rawText);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason;
      return NextResponse.json(
        { error: `Gemini returned no text content. Finish reason: ${reason ?? "unknown"}` },
        { status: 502 }
      );
    }

    const jsonStr = extractJSON(text);
    const coaching = JSON.parse(jsonStr);
    return NextResponse.json(coaching);
  } catch (e) {
    const msg = (e as Error).message ?? "Unknown error";
    console.error("Nutrition coach error:", msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
