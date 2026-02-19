
'use client';

import React from 'react';
import { Mic, Image as ImageIcon, Clapperboard, ChevronRight, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen w-full bg-[#0c0c0c] text-[#e5e5e5] flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-[--accent] opacity-[0.03] blur-[120px] rounded-full"></div>
      </div>
      <nav className="w-full p-8 flex justify-between items-center z-10">
        <span className="font-serif italic text-2xl text-[--text-main]">StoryVoice <span className="text-[--accent] text-sm tracking-widest uppercase ml-1">AI</span></span>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 max-w-5xl mx-auto">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fine bg-[#141414]/50">
          <Sparkles size={12} className="text-[--accent]" />
          <span className="text-[10px] font-mono uppercase text-[#888]">Powered by Gemini 2.5</span>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-tight mb-8">Narrativas que <br /><span className="italic text-[--accent-dim]">ganham vida.</span></h1>
        <button onClick={onEnter} className="group relative px-8 py-4 bg-[--accent] text-black font-mono text-xs font-bold uppercase tracking-widest">
          Entrar no Estúdio <ChevronRight size={14} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </main>
      <div className="w-full border-t border-fine bg-[#0e0e0e]/50 z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-fine divide-[#222]">
          <div className="p-8">
            <Mic className="text-[#444] mb-4" size={24} /><h3 className="font-serif text-xl mb-2">Vozes Neurais</h3>
            <p className="text-xs font-mono text-[#666]">Modelos de voz exclusivos com entonação emocional e ritmo perfeito.</p>
          </div>
          <div className="p-8">
            <ImageIcon className="text-[#444] mb-4" size={24} /><h3 className="font-serif text-xl mb-2">Storyboard AI</h3>
            <p className="text-xs font-mono text-[#666]">Geração automática de cenas cinematográficas em formato 9:16.</p>
          </div>
          <div className="p-8">
            <Clapperboard className="text-[#444] mb-4" size={24} /><h3 className="font-serif text-xl mb-2">Vídeos Curtos</h3>
            <p className="text-xs font-mono text-[#666]">Renderização pronta para TikTok, Reels e Shorts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
