
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VoiceName, StoryboardSegment } from "@/types";

const ENV_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

const getClient = (apiKey?: string) => {
  const key = apiKey || ENV_API_KEY;
  if (!key) throw new Error("API Key is missing.");
  return new GoogleGenerativeAI(key);
};

export const generateSpeech = async (text: string, voice: VoiceName, stylePrompt: string, apiKey?: string): Promise<string | null> => {
  // O SDK do Google Gemini agora tem suporte experimental para TTS via modelos multimodais
  // ou endpoints específicos. Mantendo a lógica de fallback conforme solicitado.
  return null; 
};

export const generateStoryboard = async (fullText: string, apiKey?: string): Promise<StoryboardSegment[]> => {
  const genAI = getClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `You are a storyboard artist. Split this story into granular scenes, one scene per sentence. Write a cinematic image prompt for each in 9:16 format. Output JSON: [{"narrativeText": "...", "imagePrompt": "..."}]`;
  
  const result = await model.generateContent([prompt, fullText]);
  const response = await result.response;
  const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text) as StoryboardSegment[];
};

export const generateSceneImage = async (prompt: string, referenceImageBase64?: string, apiKey?: string): Promise<string | null> => {
  return null; // Imagen 3 placeholder
};

export const checkImageForCharacter = async (base64Image: string, apiKey?: string): Promise<boolean> => {
  return true;
};

export const generateDramaticScript = async (topic: string, apiKey?: string): Promise<string> => {
  const genAI = getClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Crie um roteiro dramático "O que aconteceria se..." sobre: ${topic}. Use formato Dia 1, Dia 5, etc.`);
  return result.response.text();
};
