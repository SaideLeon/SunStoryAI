
'use server';
/**
 * @fileOverview AI flows for StoryVoice production.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Modality, Type } from 'genkit';

// --- Storyboard Generation ---
const StoryboardInputSchema = z.string();
const StoryboardOutputSchema = z.array(z.object({
  narrativeText: z.string(),
  imagePrompt: z.string(),
}));

export const generateStoryboardFlow = ai.defineFlow(
  {
    name: 'generateStoryboardFlow',
    inputSchema: StoryboardInputSchema,
    outputSchema: StoryboardOutputSchema,
  },
  async (fullText) => {
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      contents: fullText,
      config: {
        systemInstruction: `Você é um diretor de storyboard. Divida a história em cenas granulares. Crie uma cena para CADA frase. Gere prompts visuais cinematográficos em formato 9:16.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              narrativeText: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
            },
            required: ["narrativeText", "imagePrompt"],
          },
        },
      },
    });
    return response.output as any;
  }
);

// --- Speech Generation ---
const SpeechInputSchema = z.object({
  text: z.string(),
  voice: z.string(),
  stylePrompt: z.string(),
});

export const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: SpeechInputSchema,
    outputSchema: z.string(), // Base64 PCM data
  },
  async (input) => {
    const effectiveText = `${input.stylePrompt}\n\n${input.text}`;
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: effectiveText }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice },
          },
        },
      },
    });
    
    if (!media) throw new Error("Audio generation failed");
    return media.url.split(',')[1];
  }
);

// --- Image Generation ---
const ImageInputSchema = z.object({
  prompt: z.string(),
  referenceImage: z.string().optional(),
});

export const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: ImageInputSchema,
    outputSchema: z.string(), // Base64 Data URI
  },
  async (input) => {
    const contents: any[] = [];
    if (input.referenceImage) {
      contents.push({
        media: {
          url: input.referenceImage,
          contentType: 'image/png'
        }
      });
      contents.push({ text: `Use esta imagem como referência de estilo e personagem. Gere esta cena: ${input.prompt}` });
    } else {
      contents.push({ text: input.prompt });
    }

    const { media } = await ai.generate({
      model: 'googleai/imagen-3.0-generate-001',
      prompt: contents,
      config: {
        aspectRatio: '9:16'
      }
    });

    if (!media) throw new Error("Image generation failed");
    return media.url;
  }
);

// --- Viral Script Generation ---
const ScriptInputSchema = z.string();

export const generateViralScriptFlow = ai.defineFlow(
  {
    name: 'generateViralScriptFlow',
    inputSchema: ScriptInputSchema,
    outputSchema: z.string(),
  },
  async (topic) => {
    const response = await ai.generate({
      prompt: `Crie um roteiro viral dramático "O que aconteceria se..." sobre: ${topic}. Use o formato: Pergunta, Linha do tempo (Dia 1, 3, 7...), e conclusão impactante.`,
    });
    return response.text;
  }
);
