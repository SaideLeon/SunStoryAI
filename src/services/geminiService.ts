'use client';

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VoiceName, StoryboardSegment } from "../types";

// Default fallback key from environment
const ENV_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

const getClient = (apiKey?: string) => {
  const key = apiKey || ENV_API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please provide a key in settings or .env");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Retry helper for API calls
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorCode = error.status || error.code;
    const errorMessage = error.message || '';
    const shouldRetry = 
      errorCode === 503 || 
      errorCode === 429 || 
      errorMessage.includes('503') || 
      errorMessage.includes('UNAVAILABLE') ||
      errorMessage.includes('429');

    if (retries > 0 && shouldRetry) {
      console.warn(`API call failed with ${errorCode || errorMessage}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateSpeech = async (
  text: string, 
  voice: VoiceName,
  stylePrompt: string,
  apiKey?: string
): Promise<string | null> => {
  const ai = getClient(apiKey);

  return withRetry(async () => {
    try {
      const effectiveText = stylePrompt 
        ? `${stylePrompt}\n\n${text}`
        : text;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: effectiveText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const audioPart = candidate?.content?.parts?.[0];

      if (audioPart && audioPart.inlineData && audioPart.inlineData.data) {
        return audioPart.inlineData.data;
      }

      return null;
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  });
};

export const generateStoryboard = async (fullText: string, apiKey?: string): Promise<StoryboardSegment[]> => {
  const ai = getClient(apiKey);

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullText,
        config: {
          systemInstruction: `You are an expert storyboard artist and video director. Your task is to split the provided story into a highly granular sequence of scenes for a dynamic video.

CRITICAL RULE: Create a separate scene for EVERY SINGLE SENTENCE.
- Do NOT group multiple sentences into one scene.
- If a sentence is very long or complex, you may even split it into two scenes.
- The goal is to ensure the visual image changes frequently (every few seconds) to keep the viewer engaged.
- Never allow a single image to remain on screen for a long paragraph.

For each scene:
1. Extract the exact text segment (usually just one sentence).
2. Write a highly detailed, cinematic image generation prompt that visualizes that specific moment, suitable for vertical video (9:16 format), including camera angles, lighting, and mood.
3. Ensure visual consistency across prompts (e.g. if the main character is wearing a red cloak in scene 1, ensure they are described similarly in scene 2).`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                narrativeText: {
                  type: Type.STRING,
                  description: "The specific sentence or phrase from the original text for this scene.",
                },
                imagePrompt: {
                  type: Type.STRING,
                  description: "A detailed visual description of the scene suitable for an image generation model.",
                },
              },
              required: ["narrativeText", "imagePrompt"],
            },
          },
        },
      });

      const textResponse = response.text || "[]";
      const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(cleanedText) as StoryboardSegment[];
    } catch (error) {
      console.error("Error generating storyboard:", error);
      throw error;
    }
  });
};

export const generateSceneImage = async (prompt: string, referenceImageBase64?: string, apiKey?: string): Promise<string | null> => {
  const ai = getClient(apiKey);

  return withRetry(async () => {
    const parts: any[] = [];

    if (referenceImageBase64) {
      const [header, base64Data] = referenceImageBase64.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
      
      parts.push({ 
        text: `Adopt the artistic style, color palette, and mood of the reference image provided above. Generate a new scene based on this description: ${prompt}` 
      });
    } else {
      parts.push({ text: prompt });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          // @ts-ignore
          imageConfig: {
            aspectRatio: "9:16"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }

      return null;
    } catch (error) {
      console.error("Error generating scene image:", error);
      throw error;
    }
  });
};

export const checkImageForCharacter = async (base64Image: string, apiKey?: string): Promise<boolean> => {
  if (!apiKey && !ENV_API_KEY) return true;

  const ai = getClient(apiKey);
  
  const [header, base64Data] = base64Image.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Analyze this image. Does it contain a visible person, character, skeleton, or humanoid figure that serves as the main subject? Answer with JSON: {\"hasCharacter\": boolean}" }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text;
      if (!text) return true;
      
      const json = JSON.parse(text);
      return !!json.hasCharacter;
    } catch (e) {
      console.error("Error analyzing image for character content:", e);
      return true;
    }
  });
};

export const generateDramaticScript = async (topic: string, apiKey?: string): Promise<string> => {
  const ai = getClient(apiKey);

  const systemInstruction = `You are a viral video scriptwriter specializing in "What If" scenarios and dramatic, educational content (like TikTok/Reels/Shorts). 
  
  Your task is to take an Input topic and generate a Script Output following a strict format:
  1. Start with the title question.
  2. Break down the timeline (e.g., Dia 1, Dia 3, etc.).
  3. Use short, punchy sentences.
  4. End with a dramatic or philosophical conclusion.`;

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Input: ${topic}\nOutput:`,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      return response.text || "";
    } catch (error) {
      console.error("Error generating dramatic script:", error);
      throw error;
    }
  });
};