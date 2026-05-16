import React, { useEffect } from 'react';
import { useCharacterStore } from '../store/useCharacterStore';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, Settings, User } from 'lucide-react';
import { saveCharacter } from '../api/character-api';

export const SheetPage: React.FC = () => {
  const { character, activeCharacterId, setIsSaving } = useCharacterStore();

  useEffect(() => {
    if (activeCharacterId && character.creationComplete) {
      const timer = setTimeout(async () => {
        setIsSaving(true);
        try {
          const slugify = (str: string) => String(str ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          
          // Match the record format from CreatorPage for consistency
          const record = {
            ...character,
            ruleset: '5e-2024',
            lineageId: slugify(character.race),
            backgroundId: slugify(character.background),
            classes: (character as any).classes || [{ classId: slugify(character.class), level: character.level }],
            state: {
              hp: character.hp,
              maxHpOverride: character.maxHp,
              tempHp: character.tempHp,
              hitDiceUsed: character.hitDiceUsed,
              spellSlotsUsed: Object.fromEntries(
                Object.entries(character.spellSlots || {}).map(([level, slot]: [string, any]) => [level, slot?.used || 0])
              ),
              activeConditions: []
            }
          };
          
          await saveCharacter(record as any);
        } catch (err) {
          console.error('Auto-save failed:', err);
        } finally {
          setIsSaving(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [character, activeCharacterId, setIsSaving]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-green/10 border border-green/30 rounded-xl p-6 flex items-start gap-4">
        <div className="p-3 bg-green/20 rounded-full text-green">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white mb-1">
            Personagem Pronto!
          </h1>
          <p className="text-muted leading-relaxed">
            Seu personagem <strong className="text-white">{character.name}</strong> foi criado e salvo com sucesso. 
            Você pode ver e gerenciar todos os detalhes na ficha ao lado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Ações Rápidas">
          <div className="grid gap-2">
            <button className="flex items-center gap-3 w-full p-3 bg-bg border border-line rounded-lg text-left hover:border-gold transition-all">
              <FileText size={18} className="text-gold" />
              <span className="font-bold">Gerar PDF da Ficha</span>
            </button>
            <button className="flex items-center gap-3 w-full p-3 bg-bg border border-line rounded-lg text-left hover:border-gold transition-all">
              <User size={18} className="text-gold" />
              <span className="font-bold">Editar Biografia</span>
            </button>
            <Link to="/creator" className="flex items-center gap-3 w-full p-3 bg-bg border border-line rounded-lg text-left hover:border-gold transition-all">
              <Settings size={18} className="text-gold" />
              <span className="font-bold">Configurações</span>
            </Link>
          </div>
        </Card>

        <Card title="Notas de Campanha">
          <textarea 
            className="w-full h-32 bg-bg border border-line rounded-lg p-3 text-ink text-sm resize-none focus:border-gold outline-none"
            placeholder="Escreva suas notas de campanha aqui..."
          />
        </Card>
      </div>

      <Card title="Histórico de Nível">
        <div className="flex items-center gap-4 p-4 bg-panel border border-line rounded-lg opacity-50">
          <div className="w-10 h-10 rounded-full bg-gold/20 grid place-items-center font-black text-gold">1</div>
          <div>
            <div className="font-bold">Nível 1 Alcançado</div>
            <div className="text-xs text-muted">Aventura iniciada como {character.class}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
