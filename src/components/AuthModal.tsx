
'use client';

import React, { useState } from 'react';
import { supabase } from '@/services/supabase-client';
import { X, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: (u: any) => void }> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onSuccess(data.user);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#333] w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#666] hover:text-white">
          <X size={20} />
        </button>
        <h2 className="font-serif text-2xl text-[--accent] text-center mb-8">Bem-vindo</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-[#222] text-[#ccc] py-3 px-4 text-sm focus:border-[--accent] outline-none"
            placeholder="Email"
          />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-[#222] text-[#ccc] py-3 px-4 text-sm focus:border-[--accent] outline-none"
            placeholder="Senha"
          />
          <button type="submit" className="w-full py-3 bg-[--accent] text-black font-mono text-xs font-bold uppercase">
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
