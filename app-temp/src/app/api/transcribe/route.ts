import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Try Groq (Ultra Fast)
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const transcription = await groq.audio.transcriptions.create({
          file: file,
          model: "whisper-large-v3",
          // Added prompt to encourage Romanized Hinglish (Latin script)
          prompt: "Rahul: I'm reaching out regarding the inventory update. Kal meeting confirm hai.", 
        });
        return NextResponse.json({ text: transcription.text, provider: "groq" });
      } catch (e: any) {
        console.warn("Groq failed, falling back to OpenAI:", e.message);
      }
    }

    // 2. Fallback to OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text, provider: "openai" });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
