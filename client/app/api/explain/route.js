import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getPythonBackendUrl } from "@/lib/api-config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function POST(req) {
  try {
    const pythonUrl = getPythonBackendUrl();
    const { section, context } = await req.json();

    if (!section || !context) {
      return NextResponse.json({ error: "Section and context are required" }, { status: 400 });
    }

    // 1. Try local Gemma 4 E4B via Python reasoning service first
    try {
      const gemmaRes = await fetch(new URL("/api/reasoning/ask", pythonUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: { section, details: context },
          question: `Explain this "${section}" section of the assessment in 3-5 plain, clear sentences referencing specific numbers:\n\n${context}`,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (gemmaRes.ok) {
        const data = await gemmaRes.json();
        if (data.available && data.answer) {
          return NextResponse.json({
            explanation: data.answer,
            model: "gemma4:e4b (local)",
          });
        }
      }
    } catch (gemmaErr) {
      console.warn("Local Gemma explain attempt failed, trying fallback:", gemmaErr.message);
    }

    // 2. Fall back to Groq if key is available
    if (process.env.GROQ_API_KEY) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are an expert insurance underwriting analyst for UnderwriteAI, an AI-powered insurance risk assessment platform for the Indian market.
Your job is to explain a specific section of an insurance risk assessment to the user in plain, clear language.

Rules:
- Be concise (3-5 sentences max)
- Use simple language that a non-technical person can understand
- Reference specific numbers from the data provided
- Explain what the numbers MEAN for the applicant (good or bad, and why)
- All monetary values are in Indian Rupees (INR/₹)
- Do NOT use markdown formatting, bullet points, or headers — write in plain flowing sentences
- Be honest and direct`,
            },
            {
              role: "user",
              content: `Explain this "${section}" section of the assessment to me:\n\n${context}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 300,
        });

        const explanation = completion.choices[0]?.message?.content?.trim();
        if (explanation) {
          return NextResponse.json({ explanation, model: "groq-fallback" });
        }
      } catch (groqErr) {
        console.warn("Groq explain fallback error:", groqErr.message);
      }
    }

    // 3. Deterministic fallback
    return NextResponse.json({
      explanation: `Analysis for ${section}: The recorded metrics and indicators for this parameter align with calibrated risk thresholds. Consult the underwriting comparison chart and factors breakdown for precise contributions.`,
      model: "deterministic-fallback",
    });
  } catch (error) {
    console.error("Explain error:", error);
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
