'use client';

import React, { useEffect, useState } from 'react';
import {
  Mic,
  Image as ImageIcon,
  Clapperboard,
  ChevronRight,
  Sparkles,
  Wand2,
  Clock3,
  Layers3,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onEnterStudio: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const floatingOrbs = [
  { size: 'w-80 h-80', position: 'top-[8%] left-[8%]', delay: '0s' },
  { size: 'w-96 h-96', position: 'top-[20%] right-[-8%]', delay: '1.5s' },
  { size: 'w-72 h-72', position: 'bottom-[-12%] left-[22%]', delay: '3s' },
];

const highlights = [
  {
    icon: Mic,
    title: 'Vozes Neurais',
    desc: 'Modelos de voz com textura emocional, ritmo natural e impacto narrativo para prender atenção nos primeiros segundos.',
  },
  {
    icon: ImageIcon,
    title: 'Storyboard AI',
    desc: 'Cenas cinematográficas em 9:16 com direção visual consistente, prontas para viralizar em Reels, Shorts e TikTok.',
  },
  {
    icon: Clapperboard,
    title: 'Vídeos Curtos',
    desc: 'Pipeline completo de roteiro, narração, imagem e renderização em um único fluxo focado em creators e agências.',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnterStudio, onLogin, onRegister }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const y = ((event.clientX / innerWidth) * 2 - 1) * 7;
      const x = (((event.clientY / innerHeight) * 2 - 1) * -1) * 7;
      setRotation({ x, y });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div className="h-screen w-full bg-[#0c0c0c] text-[#e5e5e5] flex flex-col relative overflow-y-auto overflow-x-hidden custom-scrollbar font-sans [perspective:1200px]">
      <div className="absolute inset-0 pointer-events-none z-0">
        {floatingOrbs.map((orb, index) => (
          <div
            key={index}
            className={`absolute ${orb.position} ${orb.size} rounded-full bg-[--accent] opacity-[0.07] blur-[100px] animate-pulse`}
            style={{ animationDelay: orb.delay, animationDuration: '6s' }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(201,185,154,0.14),transparent_35%)]" />
      </div>

      <nav className="w-full p-6 md:p-8 flex justify-between items-center z-10">
        <span className="font-serif italic text-2xl text-[--text-main]">
          StoryVoice <span className="text-[--accent] text-sm tracking-widest uppercase ml-1">AI</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-[#8f8f8f]">
            <Sparkles size={12} className="text-[--accent]" />
            IA para creators de conteúdo
          </div>
          <button
            onClick={onLogin}
            className="px-4 py-2 border border-fine text-[10px] font-mono uppercase tracking-widest text-[#d0d0d0] hover:bg-[#1a1a1a] transition-colors"
          >
            Login
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 bg-[--accent] text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:brightness-110 transition-all"
          >
            Registro
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 max-w-6xl mx-auto">
        <div className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fine bg-[#141414]/60 backdrop-blur-md">
          <Sparkles size={12} className="text-[--accent]" />
          <span className="text-[10px] font-mono uppercase text-[#9b9b9b] tracking-widest">Powered by Gemini 2.5</span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-tight mb-5">
          Narrativas que <br />
          <span className="italic text-[--accent-dim]">ganham vida.</span>
        </h1>
        <p className="max-w-2xl text-sm md:text-base text-[#a9a9a9] mb-8">
          Transforme uma ideia em conteúdo completo com roteiro dramático, voz cinematográfica,
          storyboard automático e vídeo final. Tudo dentro de um estúdio com foco em escala e velocidade.
        </p>

        <div className="w-full max-w-3xl mb-6 rounded-xl border border-[#3a3222] bg-[#15120a]/80 p-4 text-left">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#d6b47a] mb-2">Uso de APIs</p>
          <p className="text-xs md:text-sm text-[#c7c7c7] leading-relaxed">
            O StoryVoice AI não oferece API paga padrão. Cada usuário deve configurar suas próprias chaves no
            Google AI Studio. Texto e áudio podem operar no gratuito (com cotas), enquanto imagens exigem
            projeto com faturamento ativo. Para maior resiliência, recomendamos múltiplas chaves. APIs
            de vídeo serão incluídas futuramente, quando houver crédito para testes.
          </p>
          <ul className="mt-3 space-y-1 text-[11px] md:text-xs text-[#b5b5b5] list-disc pl-4">
            <li>Crie 2+ chaves no AI Studio.</li>
            <li>Cadastre como principal + backups.</li>
            <li>Quando uma chave bater limite, troque para a próxima.</li>
          </ul>
          <a
            href="https://aistudio.google.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs font-mono uppercase tracking-widest text-[--accent] hover:brightness-110"
          >
            Criar chaves no Google AI Studio
          </a>
        </div>

        <div
          className="w-full max-w-3xl mb-8 rounded-2xl border border-fine bg-[#111]/70 backdrop-blur-md p-5 md:p-7 transition-transform duration-200"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(10px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="rounded-xl border border-fine bg-[#151515] p-4">
              <Clock3 className="text-[--accent] mb-2" size={18} />
              <p className="text-xs font-mono uppercase text-[#8a8a8a] mb-1">Tempo de produção</p>
              <p className="font-serif text-xl">-80%</p>
            </div>
            <div className="rounded-xl border border-fine bg-[#151515] p-4">
              <Layers3 className="text-[--accent] mb-2" size={18} />
              <p className="text-xs font-mono uppercase text-[#8a8a8a] mb-1">Pipeline integrado</p>
              <p className="font-serif text-xl">Roteiro → Vídeo</p>
            </div>
            <div className="rounded-xl border border-fine bg-[#151515] p-4">
              <Wand2 className="text-[--accent] mb-2" size={18} />
              <p className="text-xs font-mono uppercase text-[#8a8a8a] mb-1">Estilo visual</p>
              <p className="font-serif text-xl">Cinemático 9:16</p>
            </div>
          </div>
        </div>

        <button
          onClick={onEnterStudio}
          className="group relative px-8 py-4 bg-[--accent] text-black font-mono text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Entrar no Estúdio{' '}
          <ChevronRight size={14} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </main>

      <div className="w-full border-t border-fine bg-[#0e0e0e]/60 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-fine divide-[#222]">
          {highlights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-8">
              <Icon className="text-[#6c6c6c] mb-4" size={24} />
              <h3 className="font-serif text-xl mb-2">{title}</h3>
              <p className="text-xs font-mono text-[#8a8a8a] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-8 pb-6 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-mono uppercase text-[#6f6f6f] tracking-widest">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={12} className="text-[--accent]" />Sem watermark</span>
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={12} className="text-[--accent]" />Render para redes sociais</span>
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={12} className="text-[--accent]" />Fluxo guiado por IA</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
