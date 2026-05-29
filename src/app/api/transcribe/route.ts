import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import OpenAI from "openai";

// Language-specific prompts that prime Whisper to transcribe accurately
// These example sentences strongly nudge the model toward the right script + vocabulary
const WHISPER_PROMPTS: Record<string, string> = {
  hindi:
    "नमस्ते, मैं आपको बताना चाहता हूँ कि कल की मीटिंग कन्फर्म हो गई है। कृपया समय पर आएं और सभी दस्तावेज़ साथ लाएं।",
  hinglish:
    "Kal meeting confirm hai. Main sabko bata dunga. Please apna kaam complete karo aur report send karo by 5 PM.",
  english:
    "Hello everyone, I wanted to confirm that tomorrow's meeting is scheduled at 10 AM. Please make sure to bring all relevant documents.",
};

// Language codes for Whisper — helps it pick the right acoustic model
const WHISPER_LANGUAGE_CODES: Record<string, string> = {
  hindi: "hi",
  hinglish: "hi", // Hinglish is Hindi-dominant; English words get preserved via prompt
  english: "en",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "hinglish";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const whisperPrompt = WHISPER_PROMPTS[language] ?? WHISPER_PROMPTS.hinglish;
    const languageCode = WHISPER_LANGUAGE_CODES[language] ?? "hi";

    // 1. Try Groq (Ultra Fast — Whisper Large v3)
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const transcription = await groq.audio.transcriptions.create({
          file,
          model: "whisper-large-v3",
          language: languageCode,
          prompt: whisperPrompt,
          response_format: "verbose_json", // gives us word-level confidence
        });

        // verbose_json returns { text, words[], segments[] }
        const raw = transcription as any;
        const text: string = raw.text ?? (transcription as any).toString();

        return NextResponse.json({
          text,
          provider: "groq",
          language,
        });
      } catch (e: any) {
        console.warn("Groq transcription failed, falling back to OpenAI:", e.message);
      }
    }

    // 2. Fallback to OpenAI Whisper
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: languageCode,
      prompt: whisperPrompt,
      response_format: "verbose_json",
    });

    const raw = transcription as any;
    const text: string = raw.text ?? "";

    return NextResponse.json({ text, provider: "openai", language });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
