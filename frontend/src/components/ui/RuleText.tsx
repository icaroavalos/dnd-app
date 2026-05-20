import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Info, X, Shield } from 'lucide-react';
import { getActions, getConditions, getSpells, getFeats, getItems } from '../../api/catalog-api';
import { clean5eText } from '../../lib/data-parser';

interface RuleLinkProps {
  type: string;
  name: string;
  label?: string;
  source?: string;
}

export const RuleLink: React.FC<RuleLinkProps> = ({ type, name, label, source }) => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowConfirm] = useState(false);

  const fetchRule = async () => {
    if (content) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    try {
      let data;
      if (type === 'action') data = await getActions();
      else if (type === 'condition') data = await getConditions();
      else if (type === 'spell') data = await getSpells();
      else if (type === 'feat') data = await getFeats();
      else if (type === 'item') data = await getItems();
      else if (type === 'variantrule' || type === 'status') {
        setContent({
          name,
          source,
          entries: [`Termo de regra referenciado em ${source || 'XPHB'}.`],
        });
        setShowConfirm(true);
        return;
      }

      if (data) {
        const entry = data.results.find((r: any) => r.name.toLowerCase() === name.toLowerCase());
        if (entry) {
          setContent(entry);
          setShowConfirm(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fetchRule();
        }}
        className={cn(
          "inline-flex items-center gap-0.5 font-bold underline decoration-dotted decoration-gold/50 hover:decoration-gold transition-all text-gold/90 hover:text-gold cursor-help",
          loading && "animate-pulse"
        )}
      >
        {label || name}
        <Info size={10} className="opacity-50" />
      </button>

      {showPopup && content && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-bg/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-[400px] bg-panel border border-gold/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-4 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white">{content.name}</h4>
                  <p className="text-[10px] text-gold/60 font-bold uppercase tracking-widest">{type}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1.5 text-muted hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </header>
            <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar text-xs text-muted leading-relaxed">
              <div className="space-y-3">
                {typeof content.entries === 'string' ? (
                   <p>{clean5eText(content.entries)}</p>
                ) : (
                  content.entries?.map((entry: any, i: number) => (
                    <p key={i}>{clean5eText(typeof entry === 'string' ? entry : (entry.entries?.[0] || ''))}</p>
                  ))
                )}
              </div>
            </div>
            <footer className="p-3 bg-zinc-900/50 border-t border-line text-[9px] text-center text-zinc-500 font-bold uppercase tracking-widest">
              Source: {content.source}
            </footer>
          </div>
        </div>
      )}
    </span>
  );
};

interface RuleTextProps {
  text: string;
  className?: string;
}

type RuleTextPart =
  | { type: 'text'; text: string }
  | { type: 'link'; ruleType: string; name: string; source: string };

export const getRuleTextParts = (text: string): RuleTextPart[] => {
  const cleanedText = clean5eText(text);
  const parts = cleanedText.split(/(\[\[[a-z]+:[^|\]]+\|?[^\]]*\]\])/g);

  return parts.filter(Boolean).map((part) => {
    const match = part.match(/\[\[([a-z]+):([^|\]]+)\|?([^\]]*)\]\]/);
    if (match) {
      const [, ruleType, name, source = ''] = match;
      return { type: 'link', ruleType, name, source };
    }
    return { type: 'text', text: part };
  });
};

export const RuleText: React.FC<RuleTextProps> = ({ text, className }) => {
  if (!text) return null;

  const parts = getRuleTextParts(text);

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.type === 'link') {
          return <RuleLink key={i} type={part.ruleType} name={part.name} source={part.source} />;
        }
        return <span key={i}>{part.text}</span>;
      })}
    </div>
  );
};
