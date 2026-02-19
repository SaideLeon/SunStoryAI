
'use client';

import React from 'react';
import { Mic, Image as ImageIcon, Clapperboard, ChevronRight, Sparkles } from 'lucide-react';

export const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <div className="min-h-screen w-full bg-[#0c0c0c] text-[#e5e5e5] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-[--accent] opacity-[0.03] blur-[120px] rounded-full"></div>
      </div>

      <nav className="w-full p-8 flex justify-between items-center z-10">
        <span className="font-serif italic text-2xl">StoryVoice <span className="text-[--accent] text-sm font-sans not-italic tracking-widest uppercase ml-1">AI</span></span>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 max-w-5xl mx-auto">
        <h1 className="font-serif text-6xl md:text-8xl leading-tight mb-8">
          Narrativas que <br />
          <span className="italic text-[--accent-dim]">ganham vida.</span>
        </h1>
        <button 
          onClick={onEnter}
          className="group relative px-8 py-4 bg-[--accent] hover:bg-[#d4c5a8] text-black transition-all duration-300"
        >
          <div className="relative flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest">
            Entrar no Estúdio
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </main>
    </div>
  );
};
