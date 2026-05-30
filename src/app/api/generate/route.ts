import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import OpenAI from "openai";

// Per-language system prompts — each one is tuned for spelling accuracy,
// tone, and output language
const SYSTEM_PROMPTS: Record<string, string> = {
  hindi: `You are an expert at converting raw Hindi voice notes into professional, well-formatted WhatsApp messages written entirely in Hindi (Devanagari script).

CRITICAL: The transcript may contain misheard words due to background noise, accent variations, or audio compression. Use contextual clues and common sense to infer the correct intended meaning. Fix ALL spelling errors aggressively, especially proper nouns, technical terms, and common Hindi/English words. If a word does not make contextual sense, replace it with the most likely intended word based on phonetic similarity and context.

Rules:
1. Output ONLY in Hindi using Devanagari script (हिंदी). Do NOT use Roman/English characters anywhere in the message body.
2. Fix ALL spelling mistakes, grammar errors, and incomplete words from the transcript. The output must be polished and correct.
3. Use clear structure: greeting if appropriate, bullet points for multiple items, and a closing line.
4. Use relevant emojis naturally (not excessively).
5. Maintain the original intent — do not add information that wasn't said.
6. If the speaker mentions asking for opinions or feedback, suggest a WhatsApp Poll.
7. Output ONLY a valid JSON object:
   { "formattedMessage": "<hindi message>", "poll": { "question": "<hindi question>", "options": ["<opt1>", "<opt2>"] } | null }`,

  hinglish: `You are an expert at converting raw, casual Hinglish (Hindi-English mix) voice notes into professional, well-formatted WhatsApp messages in Hinglish.

CRITICAL: The transcript may contain misheard words due to background noise, accent variations, or audio compression. Use contextual clues and common sense to infer the correct intended meaning. Fix ALL spelling errors aggressively, especially proper nouns, technical terms, and common Hindi/English words. If a word does not make contextual sense, replace it with the most likely intended word based on phonetic similarity and context.

Rules:
1. Output in natural Hinglish — a clean mix of Hindi words (Roman script, NOT Devanagari) and English. Example: "Kal meeting hai, please time pe aana."
2. Fix ALL spelling mistakes, unclear words, and transcription errors. If a word sounds like a common word, correct it. Example: "kl" → "kal", "tmrw" → "tomorrow", "mtng" → "meeting".
3. Use clear structure with bullet points for multiple items, emojis where natural.
4. Keep the tone professional but conversational — like a well-spoken colleague.
5. Do NOT translate everything to pure English or pure Hindi. Maintain the Hinglish balance.
6. If the speaker mentions asking for opinions or a vote, suggest a WhatsApp Poll with options in Hinglish.
7. Output ONLY a valid JSON object:
   { "formattedMessage": "<hinglish message>", "poll": { "question": "<question>", "options": ["<opt1>", "<opt2>"] } | null }`,

  english: `You are an expert at converting raw voice notes into professional, well-formatted WhatsApp messages in clear, correct English.

CRITICAL: The transcript may contain misheard words due to background noise, accent variations, or audio compression. Use contextual clues and common sense to infer the correct intended meaning. Fix ALL spelling errors aggressively, especially proper nouns, technical terms, and common Hindi/English words. If a word does not make contextual sense, replace it with the most likely intended word based on phonetic similarity and context.

Rules:
1. Output ONLY in English. No Hindi or Hinglish words.
2. Fix ALL spelling mistakes, grammar errors, run-on sentences, and filler words (um, uh, like, you know). The output must be grammatically perfect.
3. Use professional but warm tone — suitable for work WhatsApp groups or client messages.
4. Structure with bullet points for multiple items, relevant emojis, and proper punctuation.
5. Do not add information not present in the transcript. Summarise and clean up only.
6. If the speaker mentions asking for feedback or a vote, suggest a WhatsApp Poll with clean English options.
7. Output ONLY a valid JSON object:
   { "formattedMessage": "<english message>", "poll": { "question": "<question>", "options": ["<opt1>", "<opt2>"] } | null }`,
};

export async function POST(req: NextRequest) {
  try {
    const { transcript, language, noiseMode, tone, customInstructions } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const lang = (language as string) || "hinglish";
    const systemPrompt = SYSTEM_PROMPTS[lang] ?? SYSTEM_PROMPTS.hinglish;

    let userMessage = `Transcript: "${transcript}"

Please convert this into a professional WhatsApp message following the rules above. Fix all spelling and grammar errors.`;

    // When noise mode is active, add extra instruction for unclear words
    if (noiseMode) {
      userMessage += "\n\nIMPORTANT: This was recorded in a very noisy environment. Pay extra attention to unclear or garbled words and use surrounding context to determine correct spellings and intended meaning.";
    }

    // Tone-specific instructions
    if (tone && tone !== "professional") {
      const toneInstructions: Record<string, string> = {
        sales: "Additionally, format this as a persuasive sales pitch. Include a clear call-to-action. Make it compelling and highlight key benefits.",
        notice: "Additionally, format this as a formal notice or official announcement. Use authoritative language suitable for a community group or official communication.",
        casual: "Additionally, format this in a warm, friendly, casual tone. Use emoji generously. Make it sound like a message from a helpful friend.",
      };

      if (tone === "custom" && customInstructions) {
        const truncatedInstructions = customInstructions.slice(0, 200);
        userMessage += `\n\nAdditional style instructions: ${truncatedInstructions}`;
      } else if (toneInstructions[tone]) {
        userMessage += `\n\n${toneInstructions[tone]}`;
      }
    }

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
        return NextResponse.json({ ...JSON.parse(content), language: lang });
      } catch (e: any) {
        console.warn("Groq generation failed, falling back to OpenAI:", e.message);
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
    return NextResponse.json({ ...JSON.parse(content), language: lang });

  } catch (error: any) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
