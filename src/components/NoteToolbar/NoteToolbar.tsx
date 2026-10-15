import React, { useState } from 'react';
import type { OcarinaKey, FontVariant, FontSizeUnit, OcarinaNote, ButtonScale } from '../../types/ocarina';
import { getNotesForKey, EXTRA_KEYS } from '../../constants/ocarinaData';
import { OcarinaDiagram } from '../OcarinaDiagram/OcarinaDiagram';
import { playOcarinaFrequency } from '../../audio/ocarinaAudio';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Play,
  Pause,
  Delete,
  Undo,
  Redo,
} from 'lucide-react';

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
  buttonScale?: ButtonScale;
  onButtonScaleChange?: (scale: ButtonScale) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onDeleteLastNote?: () => void;
  canDeleteLastNote?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  lastNoteLabel?: string | null;
  onPreviewLastNote?: () => void;
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
  buttonScale,
  onButtonScaleChange,
  isPlaying = false,
  onTogglePlay,
  onDeleteLastNote,
  canDeleteLastNote = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  lastNoteLabel,
  onPreviewLastNote,
}) => {
  const [internalScale, setInternalScale] = useState<ButtonScale>('md');
  const scale = buttonScale || internalScale;

  const handleScaleChange = (newScale: ButtonScale) => {
    if (onButtonScaleChange) {
      onButtonScaleChange(newScale);
    } else {
      setInternalScale(newScale);
    }
  };

  const scaleConfig = {
    sm: {
      btnClass: 'btn-sm min-h-[2.5rem] px-2.5',
      diagramSize: 22,
      noteTextClass: 'text-sm font-bold',
      keyBadgeClass: 'text-[10px] px-1 py-0.5',
      extraClass: 'text-xs',
      rowGap: 'gap-1.5',
    },
    md: {
      btnClass: 'btn-md min-h-[3.25rem] px-3.5',
      diagramSize: 30,
      noteTextClass: 'text-base font-extrabold',
      keyBadgeClass: 'text-xs px-1.5 py-0.5',
      extraClass: 'text-sm',
      rowGap: 'gap-2',
    },
    lg: {
      btnClass: 'btn-lg min-h-[4rem] px-4',
      diagramSize: 38,
      noteTextClass: 'text-lg font-black',
      keyBadgeClass: 'text-xs px-2 py-0.5',
      extraClass: 'text-base',
      rowGap: 'gap-2.5',
    },
  }[scale];

  const { naturals, accidentals } = getNotesForKey(ocarinaKey);

  const handleNoteClick = (note: OcarinaNote) => {
    if (soundEnabled) {
      playOcarinaFrequency(note.frequency, 0.45);
    }
    onInsertChar(note.key);
  };

  return (
    <div className="sticky top-16 z-30 flex flex-col gap-3.5 p-4 sm:p-5 bg-base-100/95 backdrop-blur-md rounded-2xl border border-base-200 shadow-md print:hidden transition-all">
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
              className="select select-bordered select-xs w-24 font-bold"
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
              className="select select-bordered select-xs w-22"
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

        {/* Right: Button Scale, Sound & Mini-diagrams toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button Scale Selector */}
          <div className="flex items-center gap-1 bg-base-200/80 p-1 rounded-xl border border-base-300">
            <SlidersHorizontal className="w-3.5 h-3.5 ml-1 text-base-content/60" />
            <span className="text-[11px] font-semibold text-base-content/70 px-1">Tamanho:</span>
            <div className="join join-horizontal">
              <button
                type="button"
                onClick={() => handleScaleChange('sm')}
                className={`btn btn-xs join-item font-bold ${scale === 'sm' ? 'btn-active btn-neutral' : 'btn-ghost'}`}
                title="Tamanho Médio-Compacto"
              >
                P
              </button>
              <button
                type="button"
                onClick={() => handleScaleChange('md')}
                className={`btn btn-xs join-item font-bold ${scale === 'md' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                title="Tamanho Grande (Recomendado para visualização ideal)"
              >
                M
              </button>
              <button
                type="button"
                onClick={() => handleScaleChange('lg')}
                className={`btn btn-xs join-item font-bold ${scale === 'lg' ? 'btn-active btn-secondary' : 'btn-ghost'}`}
                title="Tamanho Extra Grande (Máxima legibilidade)"
              >
                G
              </button>
            </div>
          </div>

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

      {/* Quick Actions Bar: Play, Delete Last Note, Undo, Redo, Last Note Preview */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-base-200/60 rounded-xl border border-base-300/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Play/Pause Button */}
          {onTogglePlay && (
            <button
              type="button"
              onClick={onTogglePlay}
              className={`btn btn-sm gap-1.5 shadow-sm font-bold ${
                isPlaying ? 'btn-warning text-warning-content' : 'btn-primary'
              }`}
              title={isPlaying ? 'Pausar reprodução' : 'Tocar tablatura agora'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pausar' : 'Tocar'}</span>
            </button>
          )}

          {/* Delete Last Note Button */}
          {onDeleteLastNote && (
            <button
              type="button"
              onClick={onDeleteLastNote}
              disabled={!canDeleteLastNote}
              className="btn btn-sm btn-outline btn-error gap-1.5 shadow-sm font-semibold disabled:opacity-40"
              title="Apagar a última nota inserida e sua sustentação (Backspace)"
            >
              <Delete className="w-4 h-4" />
              <span>Apagar Nota</span>
            </button>
          )}

          {/* Undo and Redo */}
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="btn btn-sm btn-ghost btn-square"
              title="Desfazer alteração (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="btn btn-sm btn-ghost btn-square"
              title="Refazer alteração (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Last Inserted Note Feedback */}
        {lastNoteLabel && (
          <div className="flex items-center gap-1.5 text-xs text-base-content/80 font-medium bg-base-100 px-2.5 py-1 rounded-lg border border-base-300">
            <span className="text-base-content/60">Última:</span>
            <span className="font-bold text-primary font-mono">{lastNoteLabel}</span>
            {onPreviewLastNote && (
              <button
                type="button"
                onClick={onPreviewLastNote}
                className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10 ml-0.5"
                title="Ouvir a última nota novamente"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Natural / Full Notes Row */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-base-content/80 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
            Notas Naturais:
          </span>
          <span className="text-[11px] text-base-content/50">
            Clique na nota para inserir sem rolar a página
          </span>
        </div>

        <div className={`flex flex-wrap items-center ${scaleConfig.rowGap}`}>
          {naturals.map((note) => (
            <button
              key={note.key}
              type="button"
              onClick={() => handleNoteClick(note)}
              className={`btn ${scaleConfig.btnClass} btn-primary text-primary-content gap-2 font-sans shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all`}
              title={`${note.label} (Tecla: ${note.key}) - ${note.frequency.toFixed(1)}Hz`}
            >
              {showMiniDiagrams && (
                <OcarinaDiagram
                  holes={note.holes}
                  size={scaleConfig.diagramSize}
                  bodyColor="#ffffff"
                  outlineColor="#ffffff"
                  closedHoleColor="#ffffff"
                  holeOpenColor="rgba(0,0,0,0.5)"
                />
              )}
              <div className="flex flex-col items-center leading-none">
                <span className={scaleConfig.noteTextClass}>{note.label}</span>
                <span className={`badge badge-neutral badge-xs font-mono opacity-80 mt-0.5 ${scaleConfig.keyBadgeClass}`}>
                  {note.key}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accidental / Half Notes Row */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-base-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-base-content/80 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span>
            Acidentes (Sustenidos ♯ / Bemóis ♭):
          </span>
          <span className="text-[11px] text-base-content/50">
            Notas semitons intermediárias
          </span>
        </div>

        <div className={`flex flex-wrap items-center ${scaleConfig.rowGap}`}>
          {accidentals.map((note) => (
            <button
              key={note.key}
              type="button"
              onClick={() => handleNoteClick(note)}
              className={`btn ${scaleConfig.btnClass} btn-outline border-secondary text-secondary hover:btn-secondary hover:text-secondary-content gap-2 font-sans shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all`}
              title={`${note.label} (Tecla: ${note.key}) - ${note.frequency.toFixed(1)}Hz`}
            >
              {showMiniDiagrams && (
                <OcarinaDiagram
                  holes={note.holes}
                  size={scaleConfig.diagramSize}
                  bodyColor="currentColor"
                />
              )}
              <div className="flex flex-col items-center leading-none">
                <span className={scaleConfig.noteTextClass}>{note.label}</span>
                <span className={`badge badge-ghost badge-xs font-mono opacity-80 mt-0.5 ${scaleConfig.keyBadgeClass}`}>
                  {note.key}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Extra Keys Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-base-200">
        <span className="text-xs font-semibold text-base-content/60 mr-1">
          Símbolos & Pausas:
        </span>
        {EXTRA_KEYS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => onInsertChar(k.key)}
            className={`btn btn-sm btn-ghost border border-base-300 font-mono shadow-sm hover:border-primary transition-all`}
            title={k.title}
          >
            <span className="font-bold">{k.label}</span>
          </button>
        ))}

        {/* Slur Ligature Button */}
        {onToggleSection && (
          <button
            type="button"
            onClick={onToggleSection}
            className="btn btn-sm btn-accent text-accent-content gap-1.5 ml-auto shadow-sm"
            title="Adicionar ou remover ligadura de fraseado musical (slur)"
          >
            <span className="text-base">︵</span>
            <span>Ligadura (Slur)</span>
          </button>
        )}
      </div>
    </div>
  );
};
