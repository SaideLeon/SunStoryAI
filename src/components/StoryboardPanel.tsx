'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Loader2, Sparkles, Upload, Music, Video } from 'lucide-react';
import { StoryboardSegment } from '@/types';

interface StoryboardPanelProps {
  segments: StoryboardSegment[];
  onGenerateImage: (index: number, prompt: string) => void;
  generatingIndices: number[];
  onGenerateAudio: (index: number, narrativeText: string) => void;
  generatingAudioIndices: number[];
  onGenerateAll: () => void;
  referenceImage: string | null;
  onReferenceImageChange: (image: string | null) => void;
  onDownloadImage: (index: number) => void;
  onDownloadAudio: (index: number) => void;
  onDownloadAllAssets: () => void;
  onExportVideo: () => void;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({
  segments, onGenerateImage, generatingIndices, onGenerateAudio, generatingAudioIndices,
  onGenerateAll, referenceImage, onReferenceImageChange, onDownloadImage, onDownloadAudio, onDownloadAllAssets, onExportVideo
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onReferenceImageChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const isGlobalLoading = generatingIndices.length > 0 || generatingAudioIndices.length > 0;
  const canExportVideo = segments.some(s => !!s.generatedImage && !!s.audio);

  useEffect(() => {
    if (mobileIndex > segments.length - 1) {
      setMobileIndex(Math.max(segments.length - 1, 0));
    }
  }, [mobileIndex, segments.length]);

  const goToScene = (index: number) => {
    setMobileIndex(Math.min(Math.max(index, 0), Math.max(segments.length - 1, 0)));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0]?.clientY;
    if (typeof endY !== 'number') return;

    const deltaY = touchStartY.current - endY;
    touchStartY.current = null;

    if (Math.abs(deltaY) < 50) return;

    if (deltaY > 0) {
      goToScene(mobileIndex + 1);
      return;
    }

    goToScene(mobileIndex - 1);
  };

  const renderSceneCard = (segment: StoryboardSegment, index: number) => {
    const isGeneratingThisImage = generatingIndices.includes(index);
    const isGeneratingThisAudio = generatingAudioIndices.includes(index);
    const hasImage = !!segment.generatedImage;
    const hasAudio = !!segment.audio;

    return (
      <div key={index} className="flex flex-col md:flex-row gap-6 pb-6 border-b border-[#1a1a1a] group">
        <div className="w-full md:w-16 flex md:flex-col justify-between items-start gap-4">
          <span className="font-mono text-xs text-[#444]">{String(index + 1).padStart(2, '0')}</span>
          <div className="flex gap-2">
            <button onClick={() => onGenerateAudio(index, segment.narrativeText)} disabled={isGeneratingThisAudio} className={`p-2 border border-fine ${hasAudio ? 'text-[--accent]' : 'text-[#444]'}`}>
              {isGeneratingThisAudio ? <Loader2 size={12} className="animate-spin" /> : <Music size={12} />}
            </button>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-serif text-lg text-[#ddd] mb-2">{segment.narrativeText}</p>
          <div className="bg-[#111] border border-[#222] p-3"><p className="font-mono text-[10px] text-[#555] italic">{segment.imagePrompt}</p></div>
        </div>
        <div className="w-full md:w-[140px] aspect-[9/16] bg-[#111] border border-[#222] relative group/image">
          {hasImage ? (
            <img src={segment.generatedImage} className="w-full h-full object-cover" />
          ) : (
            <button onClick={() => onGenerateImage(index, segment.imagePrompt)} disabled={isGeneratingThisImage} className="w-full h-full flex flex-col items-center justify-center text-[#333] hover:text-[--accent]">
              {isGeneratingThisImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span className="text-[9px] font-mono mt-1">GERAR</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c] overflow-hidden">
      <div className="border-b border-fine bg-[#0c0c0c] z-10 p-4 px-6 flex items-center justify-between">
        <span className="text-xs font-mono text-[#666] uppercase">{segments.length} CENAS</span>
        <div className="flex items-center gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-mono text-[#666] hover:text-[--accent] uppercase"><Upload size={12} className="inline mr-1" /> Ref Global</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <button onClick={onGenerateAll} disabled={isGlobalLoading} className="text-[10px] font-mono uppercase hover:text-[--accent]"><Sparkles size={12} className="inline mr-1" /> Auto-Gerar</button>
          <button onClick={onExportVideo} disabled={!canExportVideo || isGlobalLoading} className="bg-[--accent] text-black px-3 py-1.5 text-[10px] font-mono font-bold uppercase hover:bg-[#d4c5a8] disabled:opacity-30"><Video size={12} className="inline mr-1" /> Exportar</button>
        </div>
      </div>

      <div className="md:hidden border-b border-fine bg-[#0f0f0f] px-4 py-2">
        <p className="text-[10px] font-mono uppercase text-[#777] text-center">
          Cena {segments.length === 0 ? '00' : String(mobileIndex + 1).padStart(2, '0')} / {String(segments.length).padStart(2, '0')} · Arraste para cima/baixo
        </p>
      </div>

      <div
        className="md:hidden flex-1 overflow-hidden p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {segments[mobileIndex] ? renderSceneCard(segments[mobileIndex], mobileIndex) : (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#555] uppercase">Sem cenas</div>
        )}
      </div>

      <div className="md:hidden border-t border-fine bg-[#0f0f0f] p-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => goToScene(mobileIndex - 1)}
          disabled={segments.length === 0 || mobileIndex === 0}
          className="border border-[#2a2a2a] px-3 py-2 text-[10px] font-mono uppercase tracking-wide text-[#bbb] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={() => goToScene(mobileIndex + 1)}
          disabled={segments.length === 0 || mobileIndex >= segments.length - 1}
          className="border border-[#2a2a2a] px-3 py-2 text-[10px] font-mono uppercase tracking-wide text-[#bbb] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Próximo
        </button>
      </div>

      <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {segments.map((segment, index) => renderSceneCard(segment, index))}
      </div>
    </div>
  );
};

export default StoryboardPanel;
