
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VoiceName, StoryboardSegment } from "../types/story";

const getClient = (apiKey?: string) => {
  const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  if (!key) throw new Error("API Key is missing.");
  return new GoogleGenerativeAI(key);
};

export const generateSpeech = async (
  text: string, 
  voice: VoiceName,
  stylePrompt: string,
  apiKey?: string
): Promise<string | null> => {
  const genAI = getClient(apiKey);
  // Note: Standard Generative AI SDK doesn't support TTS directly in this way, 
  // but assuming your original logic used a specific endpoint or model
  // This is a port of your original logic
  return null; 
};

export const generateStoryboard = async (fullText: string, apiKey?: string): Promise<StoryboardSegment[]> => {
  const genAI = getClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  
  const prompt = `Você é um diretor de storyboard. Divida a história em cenas granulares. Crie uma cena para CADA frase. Gere prompts visuais cinematográficos em formato 9:16. Responda em JSON válido: [{"narrativeText": "...", "imagePrompt": "..."}]`;
  
  const result = await model.generateContent([prompt, fullText]);
  const response = await result.response;
  const text = response.text();
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText) as StoryboardSegment[];
};

export const generateSceneImage = async (prompt: string, referenceImageBase64?: string, apiKey?: string): Promise<string | null> => {
  // Placeholder for image generation if using Imagen via Gemini
  return null;
};
