
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { X, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  mode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode = 'login', onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      setIsLogin(mode === 'login');
      setError(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onSuccess(data.user);
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          if (data.session) {
             onSuccess(data.user);
             onClose();
          } else {
             setError("Cadastro realizado! Verifique seu email.");
             setLoading(false);
             return;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro de autenticação");
    } finally {
      if (!error) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#333] w-full max-w-md shadow-2xl relative p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#666] hover:text-white"><X size={20} /></button>
        <div className="text-center mb-8">
           <h2 className="font-serif text-2xl text-[--accent] mb-2">{isLogin ? 'Bem-vindo' : 'Criar Conta'}</h2>
        </div>
        {error && <div className="mb-6 p-3 bg-red-900/10 border border-red-900/30 text-red-400 text-xs font-mono">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0c0c0c] border border-[#222] text-[#ccc] py-3 px-4 text-sm focus:border-[--accent] outline-none" placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0c0c0c] border border-[#222] text-[#ccc] py-3 px-4 text-sm focus:border-[--accent] outline-none" placeholder="Senha" minLength={6} required />
          <button type="submit" disabled={loading} className="w-full py-3 bg-[--accent] text-black font-mono text-xs uppercase font-bold tracking-wider">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (isLogin ? 'Entrar' : 'Cadastrar')}</button>
        </form>
        <div className="mt-6 pt-6 border-t border-[#222] text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-xs text-[#666] hover:text-[--accent]">{isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}</button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
