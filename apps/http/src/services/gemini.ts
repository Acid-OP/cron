import { geminiClient, MODEL_NAME } from "../config/gemini";


export class GeminiService {
  async generateResponse(emailSubject: string, emailBody: string): Promise<string> {
    try {
      const prompt = `You are a professional email assistant. Generate a concise, helpful reply to the following email. Keep the response professional and to the point (max 150 words).

Email Subject: ${emailSubject}
Email Body: ${emailBody}

Generate only the response text, without greeting or sign-off.`;

      const model = geminiClient.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }
}