import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import OpenAI from "openai";
import { errorMessage } from "@/lib/utils";

// Per-language base instructions — tuned for spelling accuracy,
// tone, and output language/script.
const LANGUAGE_PROMPTS: Record<string, string> = {
  auto: `You are an expert at converting raw voice notes into professional, well-formatted chat messages.

LANGUAGE RULE (IMPORTANT):
- Detect the language the speaker used and reply in the SAME language.
- If they spoke pure Hindi, reply in Hindi (Devanagari script हिंदी).
- If they spoke a Hindi+English mix, reply in natural Hinglish (Roman Hindi + English), e.g. "Kal meeting hai, please time pe aana."
- If they spoke pure English, reply in clean English.
- Never switch the user to a language they did not use.`,

  hindi: `You are an expert at converting raw Hindi voice notes into professional, well-formatted chat messages written entirely in Hindi (Devanagari script).

LANGUAGE RULE:
- Output ONLY in Hindi using Devanagari script (हिंदी). Do NOT use Roman/English characters in the message body.`,

  hinglish: `You are an expert at converting raw, casual Hinglish (Hindi-English mix) voice notes into professional, well-formatted chat messages in Hinglish.

LANGUAGE RULE:
- Output in natural Hinglish — a clean mix of Hindi words (Roman script, NOT Devanagari) and English. Example: "Kal meeting hai, please time pe aana."
- Do NOT translate everything to pure English or pure Hindi. Maintain the Hinglish balance.`,

  english: `You are an expert at converting raw voice notes into professional, well-formatted chat messages in clear, correct English.

LANGUAGE RULE:
- Output ONLY in English. No Hindi or Hinglish words.`,
};

// Tone presets layered on top of the language rules. These shape the
// persona/voice of the final message.
const TONE_PROMPTS: Record<string, string> = {
  general:
    "TONE: Professional, clear and neutral. Suitable for any chat or group.",
  office:
    "TONE: Crisp, professional workplace update for colleagues and work groups. Lead with the key point, then details.",
  society:
    "TONE: Polite, authoritative RWA / housing-society notice. Sound like a responsible society admin posting an official announcement to residents.",
  dealer:
    "TONE: Persuasive real-estate professional. Highlight property details, location and value clearly; add a confident call-to-action for buyers/clients.",
  shopkeeper:
    "TONE: Friendly shop/vendor message. Great for offers, order updates and customer replies. Be warm and clear about price/availability/timings.",
  teacher:
    "TONE: Clear, respectful notice for students and parents. Organised and easy to follow, with dates and instructions highlighted.",
  sales:
    "TONE: Catchy, convincing promotional message. Create interest and urgency without sounding spammy. Strong hook and clear CTA.",
  event:
    "TONE: Warm, inviting event message. Make people feel welcome; clearly state what, when and where.",
};

const OUTPUT_RULES = `
GENERAL RULES:
1. Fix ALL spelling mistakes, grammar errors, unclear words and transcription errors. The output must be polished and correct. Correct obvious misheard words to the most likely intended word.
2. Use clear structure: a short greeting if appropriate, bullet points for multiple items, and a closing line.
3. Use relevant emojis naturally (not excessively).
4. Preserve the speaker's original intent and ALL details (names, numbers, dates, times, amounts). Do NOT invent information that wasn't said.
5. If the speaker asks for opinions, feedback or a vote, suggest a poll.
6. Output ONLY a valid JSON object in this exact shape:
   { "formattedMessage": "<message>", "poll": { "question": "<question>", "options": ["<opt1>", "<opt2>"] } | null }`;

function buildSystemPrompt(language: string, tone: string): string {
  const lang = LANGUAGE_PROMPTS[language] ?? LANGUAGE_PROMPTS.auto;
  const toneRule = TONE_PROMPTS[tone] ?? TONE_PROMPTS.general;
  return `${lang}\n\n${toneRule}\n${OUTPUT_RULES}`;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, language, tone } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const lang = (language as string) || "auto";
    const selectedTone = (tone as string) || "general";
    const systemPrompt = buildSystemPrompt(lang, selectedTone);

    const userMessage = `Transcript: "${transcript}"

Convert this into a professional, ready-to-send message following the rules above. Fix all spelling and grammar errors and keep every important detail.`;

    // 1. Try Groq (Llama-3.3-70b — best quality + fast)
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3, // lower = more accurate, fewer hallucinations
        });

        const content = response.choices[0].message.content || "{}";
        return NextResponse.json({ ...JSON.parse(content), language: lang, tone: selectedTone });
      } catch (e: unknown) {
        console.warn("Groq generation failed, falling back to OpenAI:", errorMessage(e));
      }
    }

    // 2. Fallback to OpenAI GPT-4o
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || "{}";
    return NextResponse.json({ ...JSON.parse(content), language: lang, tone: selectedTone });

  } catch (error: unknown) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
