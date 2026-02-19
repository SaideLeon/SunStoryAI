'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Loader2, Sparkles, Upload, Music, Video, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
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
    setMobileIndex(index);
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      <div className="md:hidden border-b border-fine bg-[#0f0f0f] px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => goToScene(Math.max(mobileIndex - 1, 0))}
          disabled={mobileIndex === 0}
          className="p-1.5 border border-fine text-[#777] disabled:opacity-30"
          aria-label="Cena anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <div className="flex min-w-max gap-2 pr-2">
            {segments.map((_, index) => (
              <button
                key={`scene-nav-${index}`}
                onClick={() => goToScene(index)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase border whitespace-nowrap ${mobileIndex === index ? 'bg-[--accent] text-black border-[--accent]' : 'bg-[#151515] text-[#777] border-[#2b2b2b]'}`}
              >
                Cena {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => goToScene(Math.min(mobileIndex + 1, segments.length - 1))}
          disabled={mobileIndex >= segments.length - 1 || segments.length === 0}
          className="p-1.5 border border-fine text-[#777] disabled:opacity-30"
          aria-label="Próxima cena"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {segments.map((segment, index) => {
          const isGeneratingThisImage = generatingIndices.includes(index);
          const isGeneratingThisAudio = generatingAudioIndices.includes(index);
          const hasImage = !!segment.generatedImage;
          const hasAudio = !!segment.audio;

          return (
            <div
              key={index}
              ref={(el) => { cardRefs.current[index] = el; }}
              className="flex flex-col md:flex-row gap-6 pb-6 border-b border-[#1a1a1a] group"
            >
              <div className="w-full md:w-16 flex md:flex-col justify-between items-start gap-4">
                <span className="font-mono text-xs text-[#444]">{String(index + 1).padStart(2, '0')}</span>
                <div className="flex gap-2">
                  <button onClick={() => onGenerateAudio(index, segment.narrativeText)} disabled={isGeneratingThisAudio} className={`p-2 border border-fine ${hasAudio ? 'text-[--accent]' : 'text-[#444]'}`}>{isGeneratingThisAudio ? <Loader2 size={12} className="animate-spin" /> : <Music size={12} />}</button>
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
        })}
      </div>
    </div>
  );
};

export default StoryboardPanel;
