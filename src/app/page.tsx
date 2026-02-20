
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Key, Upload, Loader2, X, Maximize2, Minimize2, Command, FileText, LayoutList, ChevronRight, Wand2, Sparkles, Save, FolderOpen, AlertCircle, SlidersHorizontal, LogOut, User } from 'lucide-react';
import JSZip from 'jszip';
import Controls from '@/components/Controls';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import StoryboardPanel from '@/components/StoryboardPanel';
import LandingPage from '@/components/LandingPage';
import ProjectHistoryModal from '@/components/ProjectHistoryModal';
import AuthModal from '@/components/AuthModal';
import { generateSpeech, generateStoryboard, generateSceneImage, checkImageForCharacter, generateDramaticScript } from '@/services/geminiService';
import { decodeBase64, decodeAudioData, pcmToWav } from '@/utils/audioUtils';
import { renderVideoFromSegments } from '@/utils/videoUtils';
import { VoiceName, STORY_STYLES, VISUAL_STYLES, StoryboardSegment } from '@/types';
import { supabase } from '@/services/supabaseClient';

const DEFAULT_STORY = `O que aconteceria se você ficasse entediado por tempo demais?

Dia 1
O tédio começa leve.
Você olha para o teto.
Checa o celular a cada 30 segundos em busca de dopamina.
Não há nada de novo.
Seu cérebro implora por um estímulo que não vem.

Dia 2
A irritação surge.
Você anda de um lado para o outro.
Sua mente tenta criar problemas onde não existem.
O silêncio começa a incomodar.
A falta de ruído se torna barulhenta.

Dia 5
Sua percepção do tempo muda.
Um minuto parece durar uma hora.
A criatividade tenta aflorar, mas morre por falta de combustível.
Você começa a falar sozinho apenas para ouvir uma voz.
O mundo começa a perder a cor.

Dia 10
O cérebro entra em "modo de segurança".
A apatia total se instala.
Você não sente fome, nem sono, apenas um vazio constante.
Sem desafios, sua mente começa a se desligar.
O nada é mais pesado que a dor.

Dia 20
Começam as distorções.
Sem estímulos externos, sua mente cria os próprios.
Sombras parecem se mover no canto do olho.
Sons que não existem ecoam na sala.
O tédio virou alucinação.

Dia 30
Seu cérebro começa a sofrer atrofia.
Áreas responsáveis pela memória e emoção encolhem.
A falta de novidade é veneno para os neurônios.
Você esquece quem era antes do vazio.

O tédio não é apenas falta do que fazer.
É o grito do seu cérebro por vida.

Sem o novo, a mente não descansa.
Ela simplesmente se apaga.`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderInlineMarkdown = (line: string) => {
  let rendered = escapeHtml(line);
  rendered = rendered.replace(/`([^`]+)`/g, '<code>$1</code>');
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  rendered = rendered.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return rendered;
};

const renderMarkdownToHtml = (markdown: string) => {
  const lines = markdown.split(/\r?\n/);
  let inList = false;
  let inCodeBlock = false;
  const html: string[] = [];

  const closeListIfOpen = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith('```')) {
      closeListIfOpen();
      if (!inCodeBlock) {
        html.push('<pre><code>');
        inCodeBlock = true;
      } else {
        html.push('</code></pre>');
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(`${escapeHtml(rawLine)}\n`);
      continue;
    }

    if (!line) {
      closeListIfOpen();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      closeListIfOpen();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith('>')) {
      closeListIfOpen();
      html.push(`<blockquote>${renderInlineMarkdown(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }

    if (line.match(/^[-*]\s+/)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    closeListIfOpen();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  closeListIfOpen();
  if (inCodeBlock) html.push('</code></pre>');

  return html.join('');
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [text, setText] = useState<string>(DEFAULT_STORY);
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Audio State
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Fenrir);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('experienced');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Visual Generation State
  const [selectedVisualStyleId, setSelectedVisualStyleId] = useState<string>('cinematic');

  // Storyboard State
  const [mode, setMode] = useState<'editor' | 'storyboard'>('editor');
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [storyboardSegments, setStoryboardSegments] = useState<StoryboardSegment[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  // Script Generation State
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptTopic, setScriptTopic] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
  // Generation Queues
  const [generatingIndices, setGeneratingIndices] = useState<number[]>([]);
  const [generatingAudioIndices, setGeneratingAudioIndices] = useState<number[]>([]);

  // Video Render State
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState<any | null>(null);

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [editorView, setEditorView] = useState<'write' | 'preview'>('write');

  // API Key Management State
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [keyIndex, setKeyIndex] = useState(0);
  const keyIndexRef = useRef(0);
  const keyInputRef = useRef<HTMLInputElement>(null);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // --- Auth Initialization ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserKeys(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserKeys(session.user.id);
      else {
        setApiKeys([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserKeys = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('key_value')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (data && data.length > 0) {
        const keys = data.map(k => k.key_value);
        setApiKeys(prev => {
          const combined = Array.from(new Set([...prev, ...keys]));
          return combined;
        });
      }
    } catch (err) {
      console.error("Error fetching keys", err);
    }
  };

  const saveKeysToSupabase = async (keys: string[]) => {
    if (!user) return;
    try {
      const inserts = keys.map(k => ({
        user_id: user.id,
        key_value: k,
        is_active: true
      }));
      
      const { error } = await supabase.from('user_api_keys').insert(inserts);
      if (error) console.error("Error saving keys", error);
      else setStatusMessage("Chaves salvas na nuvem!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleKeyFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const keys = text.split(/\r?\n/)
        .map(k => k.trim())
        .filter(k => k.length > 20 && k.startsWith("AIzaSy"));
      
      if (keys.length === 0) {
        setError("Nenhuma chave válida encontrada.");
        return;
      }
      
      setApiKeys(prev => Array.from(new Set([...prev, ...keys])));
      setKeyIndex(0);
      keyIndexRef.current = 0;

      if (user) {
         saveKeysToSupabase(keys);
      } else {
        setStatusMessage("Faça login para salvar chaves.");
        setTimeout(() => setStatusMessage(null), 4000);
      }

    } catch (err) {
      setError("Erro ao ler o arquivo de chaves.");
    }
    if (keyInputRef.current) keyInputRef.current.value = '';
  };

  const getNextKey = useCallback(() => {
    if (apiKeys.length > 0) {
      const currentIdx = keyIndexRef.current;
      const key = apiKeys[currentIdx];
      const nextIdx = (currentIdx + 1) % apiKeys.length;
      keyIndexRef.current = nextIdx;
      setKeyIndex(nextIdx);
      return key;
    }
    return undefined; 
  }, [apiKeys]);

  const clearKeys = () => {
    setApiKeys([]);
    setKeyIndex(0);
    keyIndexRef.current = 0;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSettings(false);
  };

  const checkAuth = () => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      setError('Faça login para acessar esta função.');
      return false;
    }
    return true;
  };

  const enterStudio = () => {
    if (checkAuth()) {
      setShowLanding(false);
    }
  };


  const openLoginModal = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openRegisterModal = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const openHistory = () => {
    if (checkAuth()) {
      setShowHistory(true);
    }
  };

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
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
    if (!checkAuth()) return;
    if (!text.trim()) return;
    setIsGeneratingAudio(true);
    setError(null);
    setAudioBuffer(null);
    setAudioBase64(null);
    stopAudio();

    try {
      const style = STORY_STYLES.find(s => s.id === selectedStyleId) || STORY_STYLES[0];
      const activeKey = getNextKey();
      const base64Audio = await generateSpeech(text, selectedVoice, style.prompt, activeKey, getNextKey);
      
      if (!base64Audio) throw new Error("Nenhum dado de áudio recebido.");

      setAudioBase64(base64Audio);
      initAudioContext();
      if (!audioContextRef.current) return;

      const rawBytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(rawBytes, audioContextRef.current, 24000, 1);
      setAudioBuffer(buffer);
    } catch (err: any) {
      setError(err.message || "Falha ao gerar narração.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };


  const handleClearGeneratedAudio = () => {
    if (!checkAuth()) return;
    stopAudio();
    setAudioBuffer(null);
    setAudioBase64(null);
  };

  const handleDownloadMainAudio = () => {
    if (!checkAuth()) return;
    if (!audioBase64) return;
    const pcmData = decodeBase64(audioBase64);
    const wavBlob = pcmToWav(pcmData);
    const url = URL.createObjectURL(wavBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storyvoice_audio_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateStoryboard = async () => {
    if (!checkAuth()) return;
    if (!text.trim()) return;
    setIsGeneratingStoryboard(true);
    setError(null);

    try {
      const activeKey = getNextKey();
      const segments = await generateStoryboard(text, activeKey, getNextKey);
      setStoryboardSegments(segments);
      setMode('storyboard');
    } catch (err: any) {
      setError("Falha ao gerar storyboard.");
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleGenerateDramaticScript = async () => {
    if (!checkAuth()) return;
    if (!scriptTopic.trim()) return;
    setIsGeneratingScript(true);
    setError(null);
    try {
      const activeKey = getNextKey();
      const generatedScript = await generateDramaticScript(scriptTopic, activeKey, getNextKey);
      setText(generatedScript);
      setShowScriptModal(false);
      setScriptTopic('');
    } catch (err: any) {
      setError("Falha ao gerar roteiro.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateSegmentAudio = async (index: number, narrativeText: string) => {
    if (!checkAuth()) return;
    if (generatingAudioIndices.includes(index)) return;
    setGeneratingAudioIndices(prev => [...prev, index]);
    setError(null);

    try {
       const style = STORY_STYLES.find(s => s.id === selectedStyleId) || STORY_STYLES[0];
       const activeKey = getNextKey();
       const base64Audio = await generateSpeech(narrativeText, selectedVoice, style.prompt, activeKey, getNextKey);

       if (base64Audio) {
        setStoryboardSegments(prev => {
          const newSegments = [...prev];
          newSegments[index] = { ...newSegments[index], audio: base64Audio };
          return newSegments;
        });
       } else {
         throw new Error("Nenhum áudio gerado.");
       }
    } catch (err: any) {
      console.error(err);
      setError(`Erro na cena ${index + 1}.`);
    } finally {
      setGeneratingAudioIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleGenerateImage = async (index: number, prompt: string, overrideReference?: string): Promise<{ image: string, hasCharacter: boolean } | null> => {
    if (!checkAuth()) return null;
    if (generatingIndices.includes(index)) return null;
    setGeneratingIndices(prev => [...prev, index]);
    setError(null);

    try {
      let effectiveReference = overrideReference;
      if (!effectiveReference) {
        for (let i = index - 1; i >= 0; i--) {
           const seg = storyboardSegments[i];
           if (seg.generatedImage && seg.hasCharacter !== false) {
                 effectiveReference = seg.generatedImage;
                 break; 
           }
        }
        if (!effectiveReference) effectiveReference = referenceImage || undefined;
      }

      const visualStyle = VISUAL_STYLES.find(v => v.id === selectedVisualStyleId) || VISUAL_STYLES[0];
      const finalPrompt = `SCENE DESCRIPTION: ${prompt}. \n\nVISUAL STYLE INSTRUCTIONS: ${visualStyle.promptSuffix}`;
      const activeKey = getNextKey();
      const base64Image = await generateSceneImage(finalPrompt, effectiveReference || undefined, activeKey, getNextKey);
      
      if (base64Image) {
        const checkKey = getNextKey();
        const hasCharacter = await checkImageForCharacter(base64Image, checkKey, getNextKey);
        setStoryboardSegments(prev => {
          const newSegments = [...prev];
          newSegments[index] = { ...newSegments[index], generatedImage: base64Image, hasCharacter: hasCharacter };
          return newSegments;
        });
        return { image: base64Image, hasCharacter };
      } else {
        throw new Error("Nenhuma imagem gerada.");
      }
    } catch (err: any) {
      console.error(err);
      setError(`Erro na cena ${index + 1}.`);
      return null;
    } finally {
      setGeneratingIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleGenerateAllImages = async () => {
    if (!checkAuth()) return;
    let currentReference = referenceImage;
    for (let i = 0; i < storyboardSegments.length; i++) {
      const segment = storyboardSegments[i];
      if (segment.generatedImage) {
        if (segment.hasCharacter !== false) currentReference = segment.generatedImage;
        continue;
      }
      const result = await handleGenerateImage(i, segment.imagePrompt, currentReference || undefined);
      if (result && result.hasCharacter !== false) currentReference = result.image;
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const playAudio = useCallback(() => {
    if (!checkAuth()) return;
    if (!audioBuffer || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    if (analyserRef.current) {
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } else {
      source.connect(audioContextRef.current.destination);
    }
    source.onended = () => setIsPlaying(false);
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  }, [audioBuffer, user]);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleDownloadImage = (index: number) => {
     if (!checkAuth()) return;
     const segment = storyboardSegments[index];
     if (!segment.generatedImage) return;
     const link = document.createElement('a');
     link.href = segment.generatedImage;
     link.download = `cena_${index + 1}.png`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleDownloadAudio = (index: number) => {
    if (!checkAuth()) return;
    const segment = storyboardSegments[index];
    if (!segment.audio) return;
    const pcmData = decodeBase64(segment.audio);
    const wavBlob = pcmToWav(pcmData);
    const url = URL.createObjectURL(wavBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cena_${index + 1}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllAssets = async () => {
    if (!checkAuth()) return;
    const zip = new JSZip();
    const folder = zip.folder("storyboard");
    if (!folder) return;

    storyboardSegments.forEach((segment, i) => {
      const idx = (i + 1).toString().padStart(2, '0');
      folder.file(`cena_${idx}_texto.txt`, segment.narrativeText);
      if (segment.generatedImage) {
        const imgData = segment.generatedImage.split(',')[1];
        folder.file(`cena_${idx}.png`, imgData, { base64: true });
      }
      if (segment.audio) {
         const pcmData = decodeBase64(segment.audio);
         const wavBlob = pcmToWav(pcmData);
         folder.file(`cena_${idx}.wav`, wavBlob);
      }
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = "storyboard.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportVideo = async () => {
    if (!checkAuth()) return;
    const segmentsToRender = storyboardSegments.filter(s => s.generatedImage && s.audio);
    if (segmentsToRender.length === 0) {
      setError("Gere imagens e áudios primeiro.");
      return;
    }
    setIsRenderingVideo(true);
    setRenderProgress({ currentSegment: 0, totalSegments: storyboardSegments.length, status: 'preparing' });
    setError(null);
    try {
      const blob = await renderVideoFromSegments(storyboardSegments, (progress) => {
        setRenderProgress(progress);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError("Erro de renderização.");
    } finally {
      setIsRenderingVideo(false);
      setRenderProgress(null);
    }
  };

  if (showLanding) {
    return (
      <>
        <LandingPage onEnterStudio={enterStudio} onLogin={openLoginModal} onRegister={openRegisterModal} />
        <AuthModal
          isOpen={showAuthModal}
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            setShowLanding(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[--bg-base] text-[--text-main] overflow-hidden">
      <AuthModal
        isOpen={showAuthModal}
        mode={authMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
      <ProjectHistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        currentData={{ text, segments: storyboardSegments, mode }}
        onLoad={(data, id) => {
          setText(data.text);
          setStoryboardSegments(data.segments);
          setMode(data.mode);
          setCurrentProjectId(id);
          setShowHistory(false);
        }}
        currentProjectId={currentProjectId}
        onUpdateCurrentId={setCurrentProjectId}
        user={user}
      />

      {showSettings && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-[#141414] border border-[#333] w-full max-w-lg">
             <div className="flex justify-between items-center p-4 border-b border-fine">
               <h3 className="text-sm font-bold font-mono uppercase text-[--accent]">Configuração</h3>
               <button onClick={() => setShowSettings(false)} className="text-[#666] hover:text-white"><X size={18} /></button>
             </div>
             <div className="p-6 space-y-6">
                <div className="space-y-4 pb-4 border-b border-fine">
                  <label className="block text-xs font-mono text-[#888] uppercase">Conta</label>
                  {user ? (
                    <div className="flex justify-between items-center bg-[#1a1a1a] p-3 border border-fine">
                      <span className="text-xs font-mono">{user.email}</span>
                      <button onClick={handleSignOut} className="text-red-400"><LogOut size={16} /></button>
                    </div>
                  ) : (
                    <button onClick={openLoginModal} className="w-full py-2 border border-[--accent] text-[--accent] font-mono text-xs uppercase">Entrar</button>
                  )}
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-mono text-[#888] uppercase">Chaves API</label>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer bg-[#0c0c0c] border border-fine text-[#ccc] py-3 px-4 flex items-center justify-center gap-2 font-mono text-xs">
                      <Upload size={14} /> CARREGAR .TXT
                      <input type="file" ref={keyInputRef} onChange={handleKeyFileUpload} accept=".txt" className="hidden" />
                    </label>
                    <button onClick={clearKeys} className="px-4 border border-fine text-red-400 font-mono text-xs">LIMPAR</button>
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {showScriptModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#141414] border border-[#333] w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b border-fine">
              <h3 className="text-sm font-bold font-mono uppercase text-[--accent] flex items-center gap-2">
                <Sparkles size={16} /> Script Mágico
              </h3>
              <button onClick={() => setShowScriptModal(false)} className="text-[#666] hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              <textarea 
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="Ex: O que aconteceria se você não dormisse?"
                className="w-full h-32 bg-[#0c0c0c] border border-fine p-4 text-[#ccc] font-serif text-lg outline-none"
              />
              <button onClick={handleGenerateDramaticScript} disabled={isGeneratingScript} className="w-full py-4 bg-[--accent] text-black font-mono font-bold text-xs uppercase">
                {isGeneratingScript ? <Loader2 size={16} className="animate-spin mx-auto" /> : "GERAR ROTEIRO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRenderingVideo && (
        <div className="fixed inset-0 z-[70] bg-[#0c0c0c]/90 flex items-center justify-center">
          <div className="w-full max-w-md p-8 border border-fine bg-[#141414] text-center space-y-6">
            <Loader2 size={32} className="animate-spin text-[--accent] mx-auto" />
            <p className="text-xs font-mono text-[--accent] uppercase tracking-widest">Exportando Vídeo...</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0 border-r border-fine bg-[--bg-base]">
          <header className="h-14 min-h-[56px] border-b border-fine flex items-center justify-between px-4 md:px-6 bg-[--bg-base]">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setShowLanding(true)}
                className="font-serif italic text-lg md:text-xl hover:text-[--accent] transition-colors"
                aria-label="Voltar para landing page"
              >
                StoryVoice <span className="text-[--accent] text-[10px] md:text-sm font-sans tracking-widest uppercase ml-1">AI</span>
              </button>
              <div className="h-4 md:h-6 w-[1px] bg-[#222] mx-1 md:mx-2"></div>
              <div className="flex gap-2 md:gap-4">
                 <button onClick={() => setMode('editor')} className={`text-[10px] md:text-xs font-mono uppercase ${mode === 'editor' ? 'text-[--accent]' : 'text-[#555]'}`}>Editor</button>
                 <button onClick={() => setMode('storyboard')} className={`text-[10px] md:text-xs font-mono uppercase ${mode === 'storyboard' ? 'text-[--accent]' : 'text-[#555]'}`}>Storyboard</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <button onClick={openHistory} className="text-[#444] hover:text-[--accent]"><FolderOpen size={16} /></button>
                <button onClick={() => setShowSettings(true)} className="text-[#444] hover:text-[#ccc]"><Settings size={16} /></button>
                <button onClick={toggleFullscreen} className="text-[#444] hover:text-[#ccc]">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
              </div>

              <button
                onClick={() => setShowMobileControls(!showMobileControls)}
                className="md:hidden text-[--accent] hover:text-white p-2"
                aria-label="Abrir controles"
              >
                <SlidersHorizontal size={20} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            {mode === 'editor' ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 relative group/editor overflow-hidden flex flex-col">
                  <button onClick={() => setShowScriptModal(true)} className="absolute top-4 right-8 z-10 bg-[#141414]/80 border border-fine text-[#888] px-3 py-2 text-xs font-mono uppercase">Script Mágico</button>
                  <div className="absolute top-4 left-8 z-10 flex border border-fine bg-[#141414]/80 text-xs font-mono uppercase">
                    <button
                      onClick={() => setEditorView('write')}
                      className={`px-3 py-2 ${editorView === 'write' ? 'text-[--accent]' : 'text-[#888]'}`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setEditorView('preview')}
                      className={`px-3 py-2 border-l border-fine ${editorView === 'preview' ? 'text-[--accent]' : 'text-[#888]'}`}
                    >
                      Markdown
                    </button>
                  </div>
                  {editorView === 'write' ? (
                    <textarea
                      className="flex-1 w-full bg-transparent p-12 pt-20 text-[#ccc] resize-none outline-none font-serif text-2xl custom-scrollbar"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Sua história começa aqui..."
                    />
                  ) : (
                    <div
                      className="markdown-preview flex-1 w-full p-12 pt-20 overflow-y-auto custom-scrollbar"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(text) }}
                    />
                  )}
                  <div className="absolute bottom-8 right-8">
                     <button onClick={handleGenerateStoryboard} disabled={isGeneratingStoryboard} className="bg-[#141414] border border-fine px-6 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-wider">
                        {isGeneratingStoryboard ? <Loader2 size={16} className="animate-spin" /> : <LayoutList size={16} />} Storyboard
                     </button>
                  </div>
                </div>
                <div className="h-32 border-t border-fine bg-[#0e0e0e] flex items-center justify-center p-4">
                   <WaveformVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
                </div>
              </div>
            ) : (
               <StoryboardPanel 
                 segments={storyboardSegments}
                 onGenerateImage={handleGenerateImage}
                 generatingIndices={generatingIndices}
                 onGenerateAudio={handleGenerateSegmentAudio}
                 generatingAudioIndices={generatingAudioIndices}
                 onGenerateAll={handleGenerateAllImages}
                 referenceImage={referenceImage}
                 onReferenceImageChange={setReferenceImage}
                 onDownloadImage={handleDownloadImage}
                 onDownloadAudio={handleDownloadAudio}
                 onDownloadAllAssets={handleDownloadAllAssets}
                 onExportVideo={handleExportVideo}
               />
            )}
          </main>
        </div>

        {showMobileControls && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setShowMobileControls(false)}
          ></div>
        )}

        <aside className={`
          fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[360px] bg-[#111] border-l border-fine flex flex-col
          transform transition-transform duration-300 ease-in-out
          md:relative md:transform-none md:w-[360px] md:flex
          ${showMobileControls ? 'translate-x-0' : 'translate-x-full'}
        `}>
             <div className="flex md:hidden justify-between items-center p-4 border-b border-fine bg-[#111]">
                <h2 className="text-xs font-mono font-bold uppercase text-[#888]">Controles do Estúdio</h2>
                <button onClick={() => setShowMobileControls(false)}>
                  <X size={18} className="text-[#666]" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
             <Controls
                onGenerate={handleGenerateAudio}
                onDownload={handleDownloadMainAudio}
                onPlay={playAudio}
                onStop={stopAudio}
                onClearAudio={handleClearGeneratedAudio}
                isPlaying={isPlaying}
                isGenerating={isGeneratingAudio}
                hasAudio={!!audioBuffer}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                selectedStyleId={selectedStyleId}
                onStyleChange={setSelectedStyleId}
                selectedVisualStyleId={selectedVisualStyleId}
                onVisualStyleChange={setSelectedVisualStyleId}
             />
             <div className="md:hidden p-6 border-t border-fine space-y-4">
               <div className="flex items-center gap-4 text-[#666]">
                 <button onClick={openHistory} className="flex flex-col items-center gap-1 hover:text-[--accent]">
                   <FolderOpen size={20} />
                   <span className="text-[9px] font-mono uppercase">Projetos</span>
                 </button>
                 <button onClick={() => setShowSettings(true)} className="flex flex-col items-center gap-1 hover:text-[--accent]">
                   <Settings size={20} />
                   <span className="text-[9px] font-mono uppercase">Settings</span>
                 </button>
                 <button onClick={toggleFullscreen} className="flex flex-col items-center gap-1 hover:text-[--accent]">
                   {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                   <span className="text-[9px] font-mono uppercase">Tela</span>
                 </button>
               </div>
               {error && (
                 <div className="text-red-400 text-xs font-mono p-2 border border-red-900/50 bg-red-900/10">
                   {error}
                 </div>
               )}
             </div>
           </div>
        </aside>
      </div>
    </div>
  );
}
