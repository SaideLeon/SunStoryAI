
export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface VoiceOption {
  id: VoiceName;
  label: string;
  description: string;
  gender: 'Male' | 'Female';
}

export interface StoryboardSegment {
  narrativeText: string;
  imagePrompt: string;
  generatedImage?: string;
  audio?: string;
  hasCharacter?: boolean;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  { id: VoiceName.Fenrir, label: 'Fenrir', description: 'Profundo, ressonante', gender: 'Male' },
  { id: VoiceName.Puck, label: 'Puck', description: 'Claro, brincalhão', gender: 'Male' },
  { id: VoiceName.Kore, label: 'Kore', description: 'Quente, suave', gender: 'Female' },
  { id: VoiceName.Charon, label: 'Charon', description: 'Baixo, rouco', gender: 'Male' },
  { id: VoiceName.Zephyr, label: 'Zephyr', description: 'Equilibrado, moderno', gender: 'Female' },
];

export const STORY_STYLES = [
  { id: 'experienced', label: 'Narrador Experiente', prompt: 'Voz cheia de sabedoria.' },
  { id: 'bedtime', label: 'História de Ninar', prompt: 'Tom suave e reconfortante.' },
  { id: 'dramatic', label: 'Trailer Dramático', prompt: 'Intenso e urgente.' },
  { id: 'news', label: 'Noticiário', prompt: 'Profissional e informativo.' },
];

export const VISUAL_STYLES = [
  { id: 'cinematic', label: 'Cinemático', promptSuffix: 'cinematic lighting, highly detailed, photorealistic, 9:16 aspect ratio.' },
  { id: 'watercolor', label: 'Aquarela', promptSuffix: 'Soft watercolor painting style, artistic.' },
];
