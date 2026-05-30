import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import OpenAI from "openai";

// Language-specific prompts that prime Whisper to transcribe accurately
// Multiple example sentences covering diverse domains give Whisper richer vocabulary context
const WHISPER_PROMPTS: Record<string, string> = {
  hindi:
    "नमस्ते, मैं आपको बताना चाहता हूँ कि कल की मीटिंग कन्फर्म हो गई है। कृपया समय पर आएं और सभी दस्तावेज़ साथ लाएं। " +
    "इस प्रॉपर्टी का रेट पचास लाख रुपये है और रजिस्ट्री का खर्चा अलग से लगेगा। पजेशन अगले महीने मिल जाएगा। " +
    "सोसाइटी की मेंटेनेंस मीटिंग रविवार को सुबह दस बजे क्लबहाउस में होगी। सभी फ्लैट ओनर्स की उपस्थिति अनिवार्य है। " +
    "हमारी दुकान पर दीवाली सेल चल रही है, सभी आइटम्स पर बीस प्रतिशत की छूट मिलेगी। ऑफर सीमित समय के लिए है।",
  hinglish:
    "Kal meeting confirm hai. Main sabko bata dunga. Please apna kaam complete karo aur report send karo by 5 PM. " +
    "Flat ka booking amount do lakh hai aur baaki EMI pe hoga. Registry charges extra lagenge, possession March mein milega. " +
    "Society meeting ka time change hua hai, ab Sunday ko 11 AM pe hogi. Maintenance ka issue discuss karenge aur parking rules finalize honge. " +
    "Dukan ka sale next week se start ho raha hai, sabhi customers ko WhatsApp pe message bhejo. Discount twenty percent hoga sab items pe. " +
    "Client ne follow-up call maangi hai, unhe kal shaam tak proposal send karna hai with revised quotation.",
  english:
    "Hello everyone, I wanted to confirm that tomorrow's meeting is scheduled at 10 AM. Please make sure to bring all relevant documents. " +
    "The property listing for the three-bedroom apartment is priced at seventy-five lakhs. Registration and stamp duty are additional costs. " +
    "This is a notice to all residents: the annual general meeting will be held on Sunday at the clubhouse. Attendance is mandatory for all flat owners. " +
    "Our business hours have been updated. The store will now open at 9 AM and close at 8 PM on weekdays. Weekend hours remain unchanged. " +
    "Please follow up with the client regarding the revised proposal. The deadline for submission is Friday at 5 PM.",
};

// Language codes for Whisper — helps it pick the right acoustic model
const WHISPER_LANGUAGE_CODES: Record<string, string> = {
  hindi: "hi",
  hinglish: "hi", // Hinglish is Hindi-dominant; English words get preserved via prompt
  english: "en",
};

// Calculate confidence score from segment avg_logprobs (0-100)
function calculateConfidence(segments: Array<{ avg_logprob?: number }> | undefined): number {
  if (!segments || segments.length === 0) return 75; // default when no data
  const totalLogProb = segments.reduce((sum, seg) => sum + (seg.avg_logprob ?? -0.5), 0);
  const avgLogProb = totalLogProb / segments.length;
  return Math.round(Math.min(100, Math.max(0, (1 + avgLogProb) * 100)));
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "hinglish";
    const noiseMode = formData.get("noiseMode") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let whisperPrompt = WHISPER_PROMPTS[language] ?? WHISPER_PROMPTS.hinglish;
    const languageCode = WHISPER_LANGUAGE_CODES[language] ?? "hi";

    // When noise mode is active, prepend noise-awareness context to the prompt
    if (noiseMode) {
      whisperPrompt =
        "Recording in a noisy environment with background chatter and ambient sounds. Focus on the primary speaker's voice and ignore background noise. " +
        whisperPrompt;
    }

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
        const confidence = calculateConfidence(raw.segments);

        return NextResponse.json({
          text,
          confidence,
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
    const confidence = calculateConfidence(raw.segments);

    return NextResponse.json({ text, confidence, provider: "openai", language });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
