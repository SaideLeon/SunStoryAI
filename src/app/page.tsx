
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Settings, Key, Upload, Loader2, X, Maximize2, Minimize2, 
  Command, FileText, LayoutList, ChevronRight, Wand2, Sparkles, 
  Save, FolderOpen, AlertCircle, SlidersHorizontal, LogOut, User 
} from 'lucide-react';
import { supabase } from '@/services/supabase-client';
import { generateSpeech, generateStoryboard, generateSceneImage } from '@/services/gemini-service';
import { decodeBase64, decodeAudioData, pcmToWav } from '@/lib/audio-utils';
import { VoiceName, STORY_STYLES, VISUAL_STYLES, AVAILABLE_VOICES, StoryboardSegment } from '@/types/story';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { LandingPage } from '@/components/LandingPage';
import { AuthModal } from '@/components/AuthModal';

const DEFAULT_STORY = `O que aconteceria se você ficasse entediado por tempo demais?

Dia 1
O tédio começa leve.
Você olha para o teto.

Dia 5
Sua percepção do tempo muda.
Um minuto parece durar uma hora.

O tédio não é apenas falta do que fazer.
É o grito do seu cérebro por vida.`;

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [text, setText] = useState<string>(DEFAULT_STORY);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Fenrir);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('experienced');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [mode, setMode] = useState<'editor' | 'storyboard'>('editor');
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [storyboardSegments, setStoryboardSegments] = useState<StoryboardSegment[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const handleGenerateAudio = async () => {
    if (!text.trim()) return;
    setIsGeneratingAudio(true);
    try {
      const style = STORY_STYLES.find(s => s.id === selectedStyleId) || STORY_STYLES[0];
      const base64Audio = await generateSpeech(text, selectedVoice, style.prompt);
      if (base64Audio) {
        initAudioContext();
        if (audioContextRef.current) {
          const rawBytes = decodeBase64(base64Audio);
          const buffer = await decodeAudioData(rawBytes, audioContextRef.current);
          setAudioBuffer(buffer);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!text.trim()) return;
    setIsGeneratingStoryboard(true);
    try {
      const segments = await generateStoryboard(text);
      setStoryboardSegments(segments);
      setMode('storyboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[--bg-base] text-[--text-main] overflow-hidden">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={(u) => setUser(u)} />
      
      <header className="h-14 border-b border-fine flex items-center justify-between px-6 bg-[--bg-base]">
        <div className="flex items-center gap-4">
          <span className="font-serif italic text-xl">StoryVoice <span className="text-[--accent] text-sm font-sans not-italic tracking-widest uppercase ml-1">AI</span></span>
          <div className="flex gap-4">
            <button onClick={() => setMode('editor')} className={`text-xs font-mono uppercase ${mode === 'editor' ? 'text-[--accent]' : 'text-[#555]'}`}>Editor</button>
            <button onClick={() => setMode('storyboard')} className={`text-xs font-mono uppercase ${mode === 'storyboard' ? 'text-[--accent]' : 'text-[#555]'}`}>Storyboard</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowAuthModal(true)} className="text-[#666] hover:text-white">
            <User size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === 'editor' ? (
            <div className="flex-1 flex flex-col p-8">
              <textarea 
                className="flex-1 bg-transparent border-none text-xl font-serif leading-relaxed focus:outline-none resize-none custom-scrollbar"
                placeholder="Escreva sua história..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="h-24 border-t border-fine flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                  <WaveformVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {storyboardSegments.map((seg, i) => (
                <div key={i} className="flex gap-6 pb-6 border-b border-fine group">
                  <div className="w-12 text-xs font-mono text-[#444]">{(i+1).toString().padStart(2, '0')}</div>
                  <div className="flex-1">
                    <p className="font-serif text-lg text-[#ddd]">{seg.narrativeText}</p>
                    <div className="mt-2 text-[10px] font-mono text-[#666] opacity-0 group-hover:opacity-100 transition-opacity">
                      {seg.imagePrompt}
                    </div>
                  </div>
                  <div className="w-32 aspect-[9/16] bg-[#111] border border-fine flex items-center justify-center">
                    <Sparkles size={16} className="text-[#333]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="w-80 border-l border-fine bg-[#111] p-6 flex flex-col gap-6">
          <div className="space-y-4">
            <label className="text-[10px] font-mono text-[#666] uppercase">Voz</label>
            <div className="grid gap-2">
              {AVAILABLE_VOICES.map(v => (
                <button 
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-3 text-left border text-xs font-mono transition-all ${selectedVoice === v.id ? 'border-[--accent] text-[--accent] bg-[#1a1a1a]' : 'border-[#222] text-[#666]'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleGenerateStoryboard}
            disabled={isGeneratingStoryboard}
            className="mt-auto w-full py-4 bg-[--accent] text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#d4c5a8] transition-colors"
          >
            {isGeneratingStoryboard ? <Loader2 className="animate-spin" /> : 'GERAR STORYBOARD'}
          </button>
        </aside>
      </main>
    </div>
  );
}
