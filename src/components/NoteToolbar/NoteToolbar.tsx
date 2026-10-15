import React from 'react';
import type { OcarinaKey, FontVariant, FontSizeUnit, OcarinaNote } from '../../types/ocarina';
import { getNotesForKey, EXTRA_KEYS } from '../../constants/ocarinaData';
import { OcarinaDiagram } from '../OcarinaDiagram/OcarinaDiagram';
import { playOcarinaFrequency } from '../../audio/ocarinaAudio';
import { Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

export interface NoteToolbarProps {
  ocarinaKey: OcarinaKey;
  onKeyChange: (key: OcarinaKey) => void;
  fontVariant: FontVariant;
  onFontVariantChange: (variant: FontVariant) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  fontSizeUnit: FontSizeUnit;
  onFontSizeUnitChange: (unit: FontSizeUnit) => void;
  onInsertChar: (char: string) => void;
  onToggleSection?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showMiniDiagrams: boolean;
  onToggleMiniDiagrams: () => void;
}

export const NoteToolbar: React.FC<NoteToolbarProps> = ({
  ocarinaKey,
  onKeyChange,
  fontVariant,
  onFontVariantChange,
  fontSize,
  onFontSizeChange,
  fontSizeUnit,
  onFontSizeUnitChange,
  onInsertChar,
  onToggleSection,
  soundEnabled,
  onToggleSound,
  showMiniDiagrams,
  onToggleMiniDiagrams,
}) => {
  const { naturals, accidentals } = getNotesForKey(ocarinaKey);

  const handleNoteClick = (note: OcarinaNote) => {
    if (soundEnabled) {
      playOcarinaFrequency(note.frequency, 0.45);
    }
    onInsertChar(note.key);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-2xl border border-base-200 shadow-sm print:hidden">
      {/* Top settings row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 pb-3">
        {/* Left: Key, Font, Size */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Key */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-base-content/70">Tom:</span>
            <select
              value={ocarinaKey}
              onChange={(e) => onKeyChange(e.target.value as OcarinaKey)}
              className="select select-bordered select-xs w-20 font-bold"
              title="Tonalidade da Ocarina (C, F ou G)"
            >
              <option value="C">C (Dó)</option>
              <option value="F">F (Fá)</option>
              <option value="G">G (Sol)</option>
            </select>
          </div>

          {/* Font Variant */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-base-content/70">Fonte:</span>
            <select
              value={fontVariant}
              onChange={(e) => onFontVariantChange(e.target.value as FontVariant)}
              className="select select-bordered select-xs w-20"
              title="Variante do desenho dos furos na fonte"
            >
              <option value="1">Modo 1</option>
              <option value="2">Modo 2</option>
            </select>
          </div>

          {/* Font Size & Unit */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-base-content/70">Tamanho:</span>
            <input
              type="number"
              min="20"
              max="160"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="input input-bordered input-xs w-16 text-center"
            />
            <select
              value={fontSizeUnit}
              onChange={(e) => onFontSizeUnitChange(e.target.value as FontSizeUnit)}
              className="select select-bordered select-xs w-16"
            >
              <option value="px">px</option>
              <option value="pt">pt</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        {/* Right: Sound & Mini-diagrams toggle */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`btn btn-xs gap-1.5 ${soundEnabled ? 'btn-success text-white' : 'btn-ghost'}`}
            title={soundEnabled ? 'Áudio ativado (Clique para mutar)' : 'Áudio mutado (Clique para ativar)'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Som Ligado' : 'Mudo'}</span>
          </button>

          {/* Mini diagrams toggle */}
          <button
            type="button"
            onClick={onToggleMiniDiagrams}
            className={`btn btn-xs gap-1.5 ${showMiniDiagrams ? 'btn-primary' : 'btn-ghost'}`}
            title="Exibir miniatura dos furinhos dentro de cada botão"
          >
            {showMiniDiagrams ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showMiniDiagrams ? 'Miniaturas' : 'Apenas Nomes'}</span>
          </button>
        </div>
      </div>

      {/* Accidental / Half Notes Row + Extras */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-base-content/60 w-16 text-right mr-1">
          Acidentes:
        </span>
        {accidentals.map((note) => (
          <button
            key={note.key}
            type="button"
            onClick={() => handleNoteClick(note)}
            className="btn btn-xs btn-outline hover:btn-secondary gap-1 font-mono text-[11px]"
            title={`${note.label} - Tecla: ${note.key} (${note.frequency.toFixed(1)}Hz)`}
          >
            {showMiniDiagrams && (
              <OcarinaDiagram holes={note.holes} size={14} bodyColor="currentColor" />
            )}
            <span>{note.label}</span>
          </button>
        ))}

        <span className="border-l border-base-300 h-5 mx-1" />

        {/* Extra Keys */}
        {EXTRA_KEYS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => onInsertChar(k.key)}
            className="btn btn-xs btn-ghost border border-base-300 font-mono text-[11px]"
            title={k.title}
          >
            <span>{k.label}</span>
          </button>
        ))}

        {/* Slur Ligature Button */}
        {onToggleSection && (
          <button
            type="button"
            onClick={onToggleSection}
            className="btn btn-xs btn-accent text-accent-content gap-1 ml-auto"
            title="Adicionar ou remover ligadura de fraseado musical (slur)"
          >
            <span>︵ Ligadura</span>
          </button>
        )}
      </div>

      {/* Natural / Full Notes Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-base-content/60 w-16 text-right mr-1">
          Naturais:
        </span>
        {naturals.map((note) => (
          <button
            key={note.key}
            type="button"
            onClick={() => handleNoteClick(note)}
            className="btn btn-xs btn-primary text-primary-content gap-1 font-mono font-bold text-[11px]"
            title={`${note.label} - Tecla: ${note.key} (${note.frequency.toFixed(1)}Hz)`}
          >
            {showMiniDiagrams && (
              <OcarinaDiagram holes={note.holes} size={14} bodyColor="currentColor" />
            )}
            <span>{note.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
