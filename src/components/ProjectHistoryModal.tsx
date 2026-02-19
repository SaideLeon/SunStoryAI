
'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, FolderOpen, Clock, FileText, Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { StoryboardSegment } from '@/types';
import { supabase } from '@/services/supabaseClient';

interface ProjectData {
  text: string;
  segments: StoryboardSegment[];
  mode: 'editor' | 'storyboard';
}

interface ProjectHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: ProjectData;
  onLoad: (data: ProjectData, id: string) => void;
  currentProjectId: string | null;
  onUpdateCurrentId: (id: string) => void;
  user: any;
}

const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({ isOpen, onClose, currentData, onLoad, currentProjectId, onUpdateCurrentId, user }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'save'>('list');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) loadProjects();
  }, [isOpen, user]);

  const loadProjects = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
      if ((!data || data.length === 0) && view === 'list') {
        setView('save');
        setNewProjectName(currentData.text.split('\n')[0]?.substring(0, 30) || 'Novo Projeto');
      }
    } catch (e: any) { setError("Erro ao carregar."); } finally { setIsLoading(false); }
  };

  const handleSaveNew = async () => {
    if (!newProjectName.trim() || !user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('projects').insert({
        user_id: user.id, name: newProjectName, text_content: currentData.text,
        segments: currentData.segments, mode: currentData.mode,
        preview: currentData.text.substring(0, 100).replace(/\n/g, ' ') + '...',
        scene_count: currentData.segments.length
      }).select().single();
      if (error) throw error;
      if (data) { onUpdateCurrentId(data.id); await loadProjects(); setView('list'); }
    } catch (e: any) { setError("Erro ao salvar."); } finally { setIsLoading(false); }
  };

  const handleUpdateCurrent = async () => {
    if (!currentProjectId || !user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('projects').update({
        text_content: currentData.text, segments: currentData.segments, mode: currentData.mode,
        preview: currentData.text.substring(0, 100).replace(/\n/g, ' ') + '...',
        scene_count: currentData.segments.length, updated_at: new Date().toISOString()
      }).eq('id', currentProjectId);
      if (error) throw error;
      await loadProjects(); setView('list');
    } catch (e: any) { setError("Erro ao atualizar."); } finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Excluir projeto?")) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      if (currentProjectId === id) onUpdateCurrentId('');
      await loadProjects();
    } catch (e: any) { setError("Erro ao excluir."); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#333] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl relative">
        <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#1a1a1a]">
          <h2 className="text-sm font-bold font-mono uppercase text-[#e5e5e5] flex items-center gap-2"><FolderOpen size={16} className="text-[--accent]" /> Histórico</h2>
          <button onClick={onClose} className="text-[#666] hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 border-b border-[#222] flex gap-2">
          <button onClick={() => setView('list')} className={`flex-1 py-2 text-xs font-mono uppercase border ${view === 'list' ? 'bg-[#222] border-[#444]' : 'border-transparent text-[#666]'}`}>Meus Projetos</button>
          <button onClick={() => setView('save')} className={`flex-1 py-2 text-xs font-mono uppercase border ${view === 'save' ? 'bg-[#222] border-[#444]' : 'border-transparent text-[#666]'}`}>Salvar Atual</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0c0c0c] relative">
          {isLoading && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center"><Loader2 size={32} className="text-[--accent] animate-spin" /></div>}
          {view === 'save' ? (
             <div className="space-y-6 max-w-md mx-auto mt-8">
                <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 outline-none" placeholder="Nome do projeto..." />
                <button onClick={handleSaveNew} className="w-full py-4 bg-[--accent] text-black font-mono font-bold uppercase text-xs">Salvar Novo</button>
                {currentProjectId && <button onClick={handleUpdateCurrent} className="w-full py-4 bg-[#222] text-[#ccc] font-mono font-bold uppercase text-xs border border-[#333]">Atualizar Existente</button>}
             </div>
          ) : (
            <div className="grid gap-3">
              {projects.map((p) => (
                <div key={p.id} onClick={() => onLoad({ text: p.text_content, segments: p.segments, mode: p.mode }, p.id)} className={`p-4 border cursor-pointer hover:border-[--accent] ${currentProjectId === p.id ? 'bg-[#1a1a1a] border-[--accent-dim]' : 'bg-[#111] border-[#222]'}`}>
                  <div className="flex justify-between items-center mb-2"><h3 className="font-serif text-lg">{p.name}</h3><button onClick={(e) => handleDelete(p.id, e)} className="text-[#444] hover:text-red-400"><Trash2 size={14} /></button></div>
                  <p className="text-xs text-[#666] italic line-clamp-1">"{p.preview}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHistoryModal;
