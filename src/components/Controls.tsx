
'use client';

import React from 'react';
import { Play, Square, Loader2, Download, Trash2 } from 'lucide-react';
import { AVAILABLE_VOICES, STORY_STYLES, VISUAL_STYLES, VoiceName } from '@/types';

interface ControlsProps {
  onGenerate: () => void;
  onDownload: () => void;
  onPlay: () => void;
  onStop: () => void;
  onClearAudio: () => void;
  isPlaying: boolean;
  isGenerating: boolean;
  hasAudio: boolean;
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  selectedStyleId: string;
  onStyleChange: (styleId: string) => void;
  selectedVisualStyleId: string;
  onVisualStyleChange: (styleId: string) => void;
}

const Controls: React.FC<ControlsProps> = ({
  onGenerate, onDownload, onPlay, onStop, onClearAudio, isPlaying, isGenerating, hasAudio,
  selectedVoice, onVoiceChange, selectedStyleId, onStyleChange, selectedVisualStyleId, onVisualStyleChange
}) => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="p-6 border-b border-fine">
        <span className="text-[10px] font-mono uppercase text-[#666]">Voz do Narrador</span>
        <div className="grid grid-cols-1 gap-1 mt-4">
          {AVAILABLE_VOICES.map((voice) => (
            <button key={voice.id} onClick={() => onVoiceChange(voice.id)} className={`p-3 border text-left transition-all ${selectedVoice === voice.id ? 'bg-[#1a1a1a] border-[--accent] text-[--text-main]' : 'bg-transparent border-transparent text-[#888]'}`}>
              <div className="flex justify-between items-center"><span className="font-serif text-lg">{voice.label}</span>{selectedVoice === voice.id && <div className="w-1.5 h-1.5 bg-[--accent]"></div>}</div>
              <div className="text-[10px] font-mono text-[#555] uppercase mt-1">{voice.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 border-b border-fine space-y-6">
        <div>
          <label className="text-[10px] font-mono text-[#666] uppercase">Estilo de Narração</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {STORY_STYLES.map((style) => (
              <button key={style.id} onClick={() => onStyleChange(style.id)} className={`p-3 text-xs font-mono border transition-all ${selectedStyleId === style.id ? 'border-[--accent] text-[--accent] bg-[#1a1a1a]' : 'border-[#222] text-[#666]'}`}>{style.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-mono text-[#666] uppercase">Estética Visual</label>
           <select value={selectedVisualStyleId} onChange={(e) => onVisualStyleChange(e.target.value)} className="w-full bg-[#0c0c0c] border border-[#333] text-[#ccc] text-xs font-mono p-3 mt-2 outline-none">
            {VISUAL_STYLES.map((style) => (<option key={style.id} value={style.id}>{style.label}</option>))}
          </select>
        </div>
      </div>
      <div className="mt-auto p-6 bg-[#0c0c0c] border-t border-fine space-y-2">
        {!hasAudio ? (
          <button onClick={onGenerate} disabled={isGenerating} className="w-full py-4 bg-[#e5e5e5] text-black font-mono text-xs uppercase font-bold">{isGenerating ? <Loader2 size={16} className="animate-spin mx-auto" /> : "GERAR NARRAÇÃO"}</button>
        ) : (
          <>
             <button onClick={isPlaying ? onStop : onPlay} className="w-full py-4 bg-[--accent] text-black font-mono text-xs font-bold uppercase flex items-center justify-center gap-2">{isPlaying ? <Square fill="currentColor" size={12} /> : <Play fill="currentColor" size={12} />} {isPlaying ? "PARAR" : "TOCAR"}</button>
             <button onClick={onDownload} className="w-full py-3 bg-[#222] text-[#ccc] font-mono text-[10px] uppercase"><Download size={14} className="inline mr-2" /> BAIXAR .WAV</button>
          </>
        )}
        <button onClick={onClearAudio} disabled={!hasAudio} className="w-full py-3 border border-[#333] text-[#a3a3a3] enabled:hover:text-white enabled:hover:border-[#555] disabled:opacity-40 disabled:cursor-not-allowed font-mono text-[10px] uppercase transition-colors"><Trash2 size={14} className="inline mr-2" /> LIMPAR ÁUDIO</button>
      </div>
    </div>
  );
};

export default Controls;
