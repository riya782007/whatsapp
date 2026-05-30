import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import OpenAI from "openai";
import { errorMessage } from "@/lib/utils";

// Shape of the verbose_json transcription response we rely on.
interface VerboseTranscription {
  text?: string;
  language?: string;
}

// Language-specific prompts that prime Whisper to transcribe accurately.
// These example sentences strongly nudge the model toward the right
// script + vocabulary. "auto" stays neutral so Whisper can self-detect.
const WHISPER_PROMPTS: Record<string, string> = {
  auto: "",
  hindi:
    "नमस्ते, मैं आपको बताना चाहता हूँ कि कल की मीटिंग कन्फर्म हो गई है। कृपया समय पर आएं और सभी दस्तावेज़ साथ लाएं।",
  hinglish:
    "Kal meeting confirm hai. Main sabko bata dunga. Please apna kaam complete karo aur report send karo by 5 PM.",
  english:
    "Hello everyone, I wanted to confirm that tomorrow's meeting is scheduled at 10 AM. Please make sure to bring all relevant documents.",
};

// Language codes for Whisper — helps it pick the right acoustic model.
// "auto" => undefined so Whisper auto-detects the spoken language.
const WHISPER_LANGUAGE_CODES: Record<string, string | undefined> = {
  auto: undefined,
  hindi: "hi",
  hinglish: "hi", // Hindi-dominant; English words preserved via prompt
  english: "en",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "auto";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const whisperPrompt = WHISPER_PROMPTS[language] ?? "";
    const languageCode = WHISPER_LANGUAGE_CODES[language]; // may be undefined (auto)

    // 1. Try Groq (Ultra Fast — Whisper Large v3)
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const transcription = await groq.audio.transcriptions.create({
          file,
          model: "whisper-large-v3",
          // only pass language when not auto-detecting
          ...(languageCode ? { language: languageCode } : {}),
          ...(whisperPrompt ? { prompt: whisperPrompt } : {}),
          response_format: "verbose_json", // gives us word-level detail + detected language
          temperature: 0, // most literal transcription, fewer hallucinations on noise
        });

        const raw = transcription as unknown as VerboseTranscription;
        const text: string = raw.text ?? "";

        return NextResponse.json({
          text,
          provider: "groq",
          language,
          detectedLanguage: raw.language ?? null,
        });
      } catch (e: unknown) {
        console.warn("Groq transcription failed, falling back to OpenAI:", errorMessage(e));
      }
    }

    // 2. Fallback to OpenAI Whisper
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      ...(languageCode ? { language: languageCode } : {}),
      ...(whisperPrompt ? { prompt: whisperPrompt } : {}),
      response_format: "verbose_json",
      temperature: 0,
    });

    const raw = transcription as unknown as VerboseTranscription;
    const text: string = raw.text ?? "";

    return NextResponse.json({
      text,
      provider: "openai",
      language,
      detectedLanguage: raw.language ?? null,
    });
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
