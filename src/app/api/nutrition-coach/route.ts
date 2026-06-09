import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { entries, userName, latestWeight } = await req.json();

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "No food entries provided" }, { status: 400 });
  }

  // Build a readable food log for Gemini
  const logText = entries
    .map((e: { date: string; time: string; mealType: string; name: string; quantity: string; notes?: string }) =>
      `${e.date} ${e.time} [${e.mealType}] ${e.name} — ${e.quantity}${e.notes ? ` (${e.notes})` : ""}`
    )
    .join("\n");

  const prompt = `You are a professional sports nutritionist and fitness coach. Analyse the food log below for ${userName || "an athlete"} who weighs ${latestWeight ? `${latestWeight} kg` : "an unknown weight"} and follows a 6-day strength training programme (biceps focus, upper body, cardio HIIT, legs & shoulders, recovery days).

FOOD LOG (most recent ${entries.length} entries):
${logText}

Provide a detailed, personalised nutrition coaching response. Be realistic, actionable and specific to Indian food culture when suggesting meals. Respond ONLY with valid JSON matching this schema exactly:

{
  "overallSummary": "2-3 sentence summary of overall eating pattern",
  "patterns": ["pattern1", "pattern2", ...],
  "concerns": ["concern1", "concern2", ...],
  "suggestions": ["actionable suggestion1", "suggestion2", ...],
  "recommendedFoods": [
    { "name": "food name", "reason": "why this food helps", "howToEat": "preparation/timing tip" }
  ],
  "recipes": [
    {
      "name": "recipe name",
      "ingredients": ["ingredient1", "ingredient2"],
      "steps": ["step1", "step2"],
      "nutritionNote": "key nutritional benefit",
      "bestFor": "when/why to eat this"
    }
  ]
}

Include 3-5 patterns, 2-4 concerns, 4-6 suggestions, 4-6 recommended foods, and 2-3 recipes.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Gemini API request failed", detail: errText }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 });
    }

    const coaching = JSON.parse(text);
    return NextResponse.json(coaching);
  } catch (e) {
    console.error("Nutrition coach error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
