import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const systemPrompt = `You are an expert at converting raw, casual Hinglish voice notes into professional, well-formatted WhatsApp messages.
          
    Guidelines:
    1. Maintain the original intent and key information.
    2. Use clear bullet points and professional emojis where appropriate.
    3. Structure the message for high readability on mobile.
    4. If the user mentions asking for opinions or preferences (e.g., "puch lo", "feedback chahiye"), identify if a WhatsApp Poll would be useful and suggest poll options.
    5. Output ONLY a valid JSON object with two fields: "formattedMessage" (string) and "poll" (object with "question" and "options" array, or null if not applicable).`;

    // 1. Try Groq (Ultra Fast Llama-3-70b)
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Transcript: ${transcript}` },
          ],
          response_format: { type: "json_object" },
        });

        return NextResponse.json(JSON.parse(response.choices[0].message.content || "{}"));
      } catch (e: any) {
        console.warn("Groq generation failed, falling back to OpenAI:", e.message);
      }
    }

    // 2. Fallback to OpenAI (GPT-4o)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript: ${transcript}` },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || "{}"));

  } catch (error: any) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
