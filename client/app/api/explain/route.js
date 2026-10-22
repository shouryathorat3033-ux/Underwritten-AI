import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { section, context } = await req.json();

    if (!section || !context) {
      return NextResponse.json({ error: "Section and context are required" }, { status: 400 });
    }

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

    const explanation = completion.choices[0]?.message?.content || "Unable to generate explanation.";
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain error:", error);
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
