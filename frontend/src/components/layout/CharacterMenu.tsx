import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../../store/useCharacterStore';
import { listCharacters, deleteCharacter, getCharacter, saveCharacter, type CharacterSummary } from '../../api/character-api';
import { Plus, Trash2, User, X, Save, Loader2, ChevronRight, Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface CharacterMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterMenu: React.FC<CharacterMenuProps> = ({ isOpen, onClose }) => {
  const { character, setCharacter, setActiveCharacterId, resetCharacter } = useCharacterStore();
  const [summaries, setSummaries] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCharacters();
      setSummaries(data);
    } catch (err) {
      console.error('Failed to list characters:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      fetchCharacters();
      // Lock scroll
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, fetchCharacters, onClose]);

  const handleNew = () => {
    resetCharacter();
    setShowNewConfirm(false);
    navigate('/creator');
    onClose();
  };

  const handleSelect = async (id: string) => {
    if (character.id === id) {
      navigate('/sheet');
      onClose();
      return;
    }
    
    setActionLoading(`load-${id}`);
    try {
      const fullChar = await getCharacter(id);
      if (fullChar) {
        // First reset, then set the new character
        resetCharacter();
        // Give a tiny tick for the store to clear before hydration if needed, 
        // but setCharacter now handles mapping internally
        setCharacter(fullChar);
        setActiveCharacterId(id);
        navigate('/sheet');
        onClose();
      }
    } catch (err) {
      console.error('Failed to load character:', err);
      setToast({ message: 'Erro ao carregar personagem.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    setActionLoading(`delete-${id}`);
    try {
      await deleteCharacter(id);
      setSummaries(prev => prev.filter(s => s.id !== id));
      if (character.id === id) {
        resetCharacter();
      }
      setDeleteConfirmId(null);
      setToast({ message: 'Personagem excluído.', type: 'success' });
    } catch (err) {
      console.error('Failed to delete character:', err);
      setToast({ message: 'Erro ao deletar personagem.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    setActionLoading('delete-all');
    try {
      for (const s of summaries) {
        await deleteCharacter(s.id);
      }
      setSummaries([]);
      resetCharacter();
      setShowDeleteAllConfirm(false);
      setToast({ message: 'Todas as fichas foram apagadas.', type: 'success' });
    } catch (err) {
      console.error('Failed to delete all characters:', err);
      setToast({ message: 'Erro ao limpar baú.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className={twMerge(
          "fixed bottom-6 left-6 z-[100] px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-left-4",
          toast.type === 'success' ? "bg-teal/20 border-teal/40 text-teal" : "bg-rose/20 border-rose/40 text-rose"
        )}>
          <div className={twMerge("w-2 h-2 rounded-full", toast.type === 'success' ? "bg-teal" : "bg-rose")} />
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Backdrop */}
      <div 
        className={twMerge(
          "fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        aria-hidden={!isOpen}
        className={twMerge(
          "fixed top-0 left-0 z-50 h-full w-full max-w-[340px] bg-panel border-r border-line shadow-[10px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full invisible"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-panel/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
              <User className="text-gold" size={18} />
            </div>
            <h2 className="text-lg font-bold text-ink tracking-tight">Suas Fichas</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-line rounded-xl transition-all active:scale-95 text-muted hover:text-ink"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 grid grid-cols-1 gap-3 border-b border-line bg-bg/30">
          {showNewConfirm ? (
            <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowNewConfirm(false)}
                className="flex-1 py-3 px-4 bg-bg border border-line text-muted font-bold rounded-xl hover:bg-line transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleNew}
                className="flex-[2] py-3 px-4 bg-rose text-bg font-black rounded-xl hover:bg-rose/90 transition-all shadow-lg shadow-rose/10 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                CONFIRMAR
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowNewConfirm(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gold hover:bg-gold/90 text-bg font-black rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-gold/10 group"
            >
              <Plus size={20} className="transition-transform group-hover:rotate-90" />
              NOVA FICHA
            </button>
          )}
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Personagens Salvos</h3>
            
            <div className="flex items-center gap-3">
              {summaries.length > 0 && (
                showDeleteAllConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <span className="text-[9px] font-black text-rose uppercase">Apagar tudo?</span>
                    <button 
                      onClick={() => setShowDeleteAllConfirm(false)}
                      className="p-1.5 hover:bg-line rounded-md text-muted transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <button 
                      onClick={handleDeleteAll}
                      disabled={actionLoading === 'delete-all'}
                      className="bg-rose text-bg text-[9px] font-black px-2 py-1 rounded-md hover:bg-rose/90 transition-all active:scale-95"
                    >
                      {actionLoading === 'delete-all' ? <Loader2 size={10} className="animate-spin" /> : 'SIM, LIMPAR'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="text-[9px] font-black text-muted hover:text-rose transition-colors uppercase tracking-wider"
                  >
                    LIMPAR TUDO
                  </button>
                )
              )}
              {loading && <Loader2 size={12} className="text-teal animate-spin" />}
            </div>
          </div>
          
          {summaries.length === 0 && !loading && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-line mx-auto flex items-center justify-center text-muted">
                <User size={24} />
              </div>
              <p className="text-muted text-sm italic">Nenhuma ficha encontrada no baú.</p>
            </div>
          )}

          <div className="space-y-2.5">
            {summaries.map(s => {
              const isActive = character.id === s.id;
              const isDeleting = deleteConfirmId === s.id;
              const isCurrentAction = actionLoading === `load-${s.id}` || actionLoading === `delete-${s.id}`;

              return (
                <div 
                  key={s.id}
                  onClick={() => !isDeleting && handleSelect(s.id)}
                  className={twMerge(
                    "group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer",
                    isActive 
                      ? "bg-gold/10 border-gold/40 shadow-[0_0_15px_rgba(213,166,51,0.05)]" 
                      : "bg-bg/40 border-line hover:border-teal/40 hover:bg-bg/60",
                    isDeleting && "border-rose/50 bg-rose/5"
                  )}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={twMerge(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                      isActive ? "bg-gold/20 text-gold" : "bg-panel text-muted group-hover:text-teal group-hover:bg-teal/10"
                    )}>
                      {isCurrentAction ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="truncate pr-2">
                      <div className={twMerge(
                        "font-bold text-[15px] truncate transition-colors",
                        isActive ? "text-gold" : "text-ink group-hover:text-teal"
                      )}>
                        {s.name || 'Sem Nome'}
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-1.5 uppercase tracking-wide font-medium">
                        <span className="text-gold/80">{s.primaryClass.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
                        <span className="opacity-30">•</span>
                        <span>Nível {s.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {isDeleting ? (
                      <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                        <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-2 text-muted hover:text-ink hover:bg-line rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(s.id, e)}
                          className="p-2 bg-rose text-bg rounded-lg hover:bg-rose/90 transition-all active:scale-90"
                          title="Confirmar exclusão"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => handleDelete(s.id, e)}
                        className="p-2.5 text-muted hover:text-rose hover:bg-rose/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Excluir ficha"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    
                    {!isDeleting && (
                      <ChevronRight 
                        size={18} 
                        className={twMerge(
                          "transition-transform text-muted/30 group-hover:text-teal",
                          isActive ? "text-gold/50" : "group-hover:translate-x-0.5"
                        )} 
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-line bg-panel/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            <span className="text-[10px] text-muted font-bold tracking-widest uppercase">Sistema Online</span>
          </div>
          <span className="text-[10px] text-muted font-medium italic opacity-50">v1.1.0-modern</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #242424;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}} />
    </>
  );
};
