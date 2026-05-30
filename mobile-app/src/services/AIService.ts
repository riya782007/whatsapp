import axios from 'axios';

// Production: points to your deployed Vercel web app
const API_BASE_URL = 'https://whatsapp-theta-nine.vercel.app/api';

export interface AIResult {
  formattedMessage: string;
  poll: {
    question: string;
    options: string[];
  } | null;
}

export class AIService {
  static async transcribeAndFormat(audioUri: string, language: string = 'hinglish'): Promise<AIResult> {
    try {
      // 1. Prepare Audio for Upload
      const formData = new FormData();
      // @ts-ignore - React Native FormData requires this structure
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      formData.append('language', language);

      // 2. Transcribe
      const transcribeRes = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      const transcript = transcribeRes.data.text;

      // 3. Generate Professional Message
      const generateRes = await axios.post(`${API_BASE_URL}/generate`, {
        transcript,
        language,
      }, {
        timeout: 30000,
      });

      return generateRes.data;
    } catch (error: any) {
      console.error('AI Processing Error:', error?.message || error);
      throw error;
    }
  }
}
