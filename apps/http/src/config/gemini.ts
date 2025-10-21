import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY!;

const client = new GoogleGenerativeAI(apiKey);

export const geminiClient = client;
export const MODEL_NAME = 'gemini-2.5-flash';
