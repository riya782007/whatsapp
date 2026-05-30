import axios from 'axios';

// Points to your deployed Vercel web app (it hosts the AI APIs).
// Override by setting EXPO_PUBLIC_API_BASE_URL in your env / eas secrets.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://voice2wa.vercel.app/api';

export type Language = 'auto' | 'hindi' | 'hinglish' | 'english';
export type Tone =
  | 'general'
  | 'office'
  | 'society'
  | 'dealer'
  | 'shopkeeper'
  | 'teacher'
  | 'sales'
  | 'event';

export interface AIResult {
  formattedMessage: string;
  poll: {
    question: string;
    options: string[];
  } | null;
}

export class AIService {
  static async transcribeAndFormat(
    audioUri: string,
    language: Language = 'auto',
    tone: Tone = 'general'
  ): Promise<AIResult> {
    try {
      // 1. Prepare audio for upload
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as unknown as Blob);
      formData.append('language', language);

      // 2. Transcribe (with the chosen language hint; "auto" = detect)
      const transcribeRes = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      const transcript = transcribeRes.data.text;

      // 3. Generate the professional message in the chosen language + tone
      const generateRes = await axios.post(
        `${API_BASE_URL}/generate`,
        { transcript, language, tone },
        { timeout: 30000 }
      );

      return generateRes.data;
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.message
        : 'AI processing failed';
      console.error('AI Processing Error:', message);
      throw error;
    }
  }
}
