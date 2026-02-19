
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Settings, Key, Upload, Loader2, X, Maximize2, Minimize2, 
  Command, FileText, LayoutList, ChevronRight, Wand2, Sparkles, 
  Save, FolderOpen, AlertCircle, SlidersHorizontal, LogOut, User as UserIcon 
} from 'lucide-react';
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  generateStoryboardFlow, 
  generateSpeechFlow, 
  generateImageFlow, 
  generateViralScriptFlow 
} from '@/ai/flows/story-production';
import { decodeBase64, decodeAudioData, pcmToWav } from '@/lib/audio-utils';
import { 
  AVAILABLE_VOICES, STORY_STYLES, VISUAL_STYLES, 
  VoiceName, StoryboardSegment, ProjectData 
} from '@/types/story';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const DEFAULT_STORY = `O que aconteceria se você parasse de dormir?

Dia 1
A irritação surge.
Você anda de um lado para o outro.
O silêncio começa a incomodar.

Dia 5
Sua percepção do tempo muda.
Um minuto parece durar uma hora.
Você começa a falar sozinho.

Dia 10
O cérebro entra em "modo de segurança".
A apatia total se instala.
O nada é mais pesado que a dor.`;

export default function StoryVoiceStudio() {
  const { user } = useUser();
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();

  const [text, setText] = useState(DEFAULT_STORY);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Fenrir);
  const [selectedStyleId, setSelectedStyleId] = useState('experienced');
  const [selectedVisualStyleId, setSelectedVisualStyleId] = useState('cinematic');
  const [mode, setMode] = useState<'editor' | 'storyboard'>('editor');
  const [segments, setSegments] = useState<StoryboardSegment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const handleGenerateStoryboard = async () => {
    setIsGenerating(true);
    try {
      const result = await generateStoryboardFlow(text);
      setSegments(result);
      setMode('storyboard');
      toast({ title: "Storyboard criado!", description: "Sua história foi dividida em cenas." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao processar história." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSpeech = async () => {
    setIsGenerating(true);
    try {
      const style = STORY_STYLES.find(s => s.id === selectedStyleId);
      const base64 = await generateSpeechFlow({
        text,
        voice: selectedVoice,
        stylePrompt: style?.prompt || ''
      });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const raw = decodeBase64(base64);
      const buffer = await decodeAudioData(raw, ctx);
      setAudioBuffer(buffer);
      toast({ title: "Voz gerada!", description: "Clique no play para ouvir." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar narração." });
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (!audioBuffer || !audioContextRef.current) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    sourceNodeRef.current?.stop();
    setIsPlaying(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Controls */}
      <aside className="w-[360px] border-r border-white/5 bg-card p-6 flex flex-col gap-8 overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary/60">Configurações de Voz</h2>
          <div className="grid gap-2">
            {AVAILABLE_VOICES.map(v => (
              <button 
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`p-3 text-left border transition-all ${selectedVoice === v.id ? 'border-primary bg-primary/10' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className="font-medium">{v.label}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{v.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary/60">Estilo de Narração</h2>
          <div className="grid grid-cols-2 gap-2">
            {STORY_STYLES.map(s => (
              <button 
                key={s.id}
                onClick={() => setSelectedStyleId(s.id)}
                className={`p-2 text-xs border ${selectedStyleId === s.id ? 'border-primary bg-primary/10' : 'border-white/5'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <Button 
            className="w-full h-12 font-mono" 
            onClick={handleGenerateSpeech}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : 'GERAR NARRAÇÃO'}
          </Button>
          {audioBuffer && (
            <Button variant="secondary" className="w-full h-12" onClick={isPlaying ? stopAudio : playAudio}>
              {isPlaying ? 'PARAR' : 'OUVIR'}
            </Button>
          )}
        </div>
      </aside>

      {/* Main Studio */}
      <main className="flex-1 flex flex-col bg-background relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <span className="font-serif italic text-xl tracking-tight">StoryVoice <span className="text-primary text-xs font-sans not-italic font-bold ml-1">AI</span></span>
            <div className="flex gap-4">
              <button onClick={() => setMode('editor')} className={`text-xs uppercase font-mono ${mode === 'editor' ? 'text-primary' : 'text-muted-foreground'}`}>Editor</button>
              <button onClick={() => setMode('storyboard')} className={`text-xs uppercase font-mono ${mode === 'storyboard' ? 'text-primary' : 'text-muted-foreground'}`}>Storyboard</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button variant="ghost" size="sm" className="gap-2">
                <UserIcon size={14} /> {user.email}
              </Button>
            ) : (
              <Button variant="outline" size="sm">Entrar</Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-8">
          {mode === 'editor' ? (
            <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
              <Textarea 
                value={text}
                onChange={e => setText(e.target.value)}
                className="flex-1 bg-transparent border-none text-2xl font-serif leading-relaxed focus-visible:ring-0 resize-none p-0 custom-scrollbar"
                placeholder="Comece sua história..."
              />
              <div className="flex justify-end">
                <Button size="lg" className="gap-2" onClick={handleGenerateStoryboard}>
                  Gerar Storyboard <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto custom-scrollbar space-y-8 pr-4">
              {segments.map((seg, i) => (
                <div key={i} className="flex gap-8 pb-8 border-b border-white/5 last:border-0 group">
                  <div className="w-12 text-primary/40 font-mono pt-1">{(i+1).toString().padStart(2, '0')}</div>
                  <div className="flex-1">
                    <p className="text-xl font-serif mb-4 text-white/90">{seg.narrativeText}</p>
                    <div className="bg-white/5 p-3 rounded-sm text-[11px] font-mono text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                      {seg.imagePrompt}
                    </div>
                  </div>
                  <div className="w-[140px] aspect-[9/16] bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors cursor-pointer">
                    <Sparkles size={24} className="text-white/20" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
