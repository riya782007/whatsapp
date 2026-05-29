import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "app-temp/.env.local") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testLogic() {
  const sampleTranscript = "Suno team, kal subah 11 baje shop par ek urgent meeting hai new product inventory discuss karne ke liye. Sabka aana jaroori hai. Aur haan, zara group me puch lo ki sab veg khayenge ya non-veg lunch me, us hisab se order karenge.";
  
  console.log("--- Testing Generation Logic ---");
  console.log("Input:", sampleTranscript);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at converting raw, casual Hinglish voice notes into professional, well-formatted WhatsApp messages.
          
          Guidelines:
          1. Maintain the original intent and key information.
          2. Use clear bullet points and professional emojis where appropriate.
          3. Structure the message for high readability on mobile.
          4. If the user mentions asking for opinions or preferences (e.g., "puch lo", "feedback chahiye"), identify if a WhatsApp Poll would be useful and suggest poll options.
          5. Output the result in JSON format with two fields: "formattedMessage" (string) and "poll" (object with "question" and "options" array, or null if not applicable).`,
        },
        {
          role: "user",
          content: `Transcript: ${sampleTranscript}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    console.log("Output:", JSON.stringify(JSON.parse(response.choices[0].message.content || "{}"), null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testLogic();
