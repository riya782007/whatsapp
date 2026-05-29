import axios from 'axios';
import { Audio } from 'expo-av';

// Replace with your actual deployed backend URL or local IP for testing
const API_BASE_URL = 'http://YOUR_LOCAL_IP:3000/api'; 

export interface AIResult {
  formattedMessage: string;
  poll: {
    question: string;
    options: string[];
  } | null;
}

export class AIService {
  static async transcribeAndFormat(audioUri: string): Promise<AIResult> {
    try {
      // 1. Prepare Audio for Upload
      const formData = new FormData();
      // @ts-ignore - React Native FormData requires this structure
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });

      // 2. Transcribe using our existing backend logic
      // In a production keyboard, we'd hit the API directly
      const transcribeRes = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const transcript = transcribeRes.data.text;

      // 3. Generate Professional Message
      const generateRes = await axios.post(`${API_BASE_URL}/generate`, {
        transcript: transcript,
      });

      return generateRes.data;
    } catch (error) {
      console.error('AI Processing Error:', error);
      throw error;
    }
  }
}
