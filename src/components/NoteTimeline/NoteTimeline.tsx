import React, { useMemo } from 'react';
import type { OcarinaKey, ParsedNoteToken } from '../../types/ocarina';
import {
  parseTabTokens,
  updateNoteDurationInTab,
  deleteNoteFromTab,
  formatDurationLabel,
} from '../../utils/ocarinaParser';
import { OcarinaDiagram } from '../OcarinaDiagram/OcarinaDiagram';
import { playOcarinaFrequency } from '../../audio/ocarinaAudio';
import { Clock, Play, Trash2, Plus, Minus, Music2, Sparkles } from 'lucide-react';

export interface NoteTimelineProps {
  tabText: string;
  onTabTextChange: (newText: string) => void;
  ocarinaKey: OcarinaKey;
  soundEnabled: boolean;
  bpm: number;
  activePlaybackIndex?: number | null;
}

export const NoteTimeline: React.FC<NoteTimelineProps> = ({
  tabText,
  onTabTextChange,
  ocarinaKey,
  soundEnabled,
  bpm,
  activePlaybackIndex,
}) => {
  const tokens = useMemo(
    () => parseTabTokens(tabText, ocarinaKey),
    [tabText, ocarinaKey]
  );

  const totalBeats = useMemo(() => {
    return tokens.reduce((acc, t) => acc + t.beats, 0);
  }, [tokens]);

  const estimatedDurationSeconds = useMemo(() => {
    return ((totalBeats * 60) / bpm).toFixed(1);
  }, [totalBeats, bpm]);

  const handleSetDuration = (token: ParsedNoteToken, beats: number) => {
    const updated = updateNoteDurationInTab(tabText, token, beats);
    onTabTextChange(updated);

    if (soundEnabled && token.note) {
      const durSec = (beats * 60) / bpm;
      playOcarinaFrequency(token.note.frequency, Math.min(durSec, 1.2));
    }
  };

  const handleAdjustDuration = (token: ParsedNoteToken, delta: number) => {
    const newBeats = Math.max(0.5, Math.min(8, token.beats + delta));
    handleSetDuration(token, newBeats);
  };

  const handleDelete = (token: ParsedNoteToken) => {
    const updated = deleteNoteFromTab(tabText, token);
    onTabTextChange(updated);
  };

  const handlePreviewNote = (token: ParsedNoteToken) => {
    if (soundEnabled && token.note) {
      const durSec = (token.beats * 60) / bpm;
      playOcarinaFrequency(token.note.frequency, Math.min(durSec, 2.0));
    }
  };

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-base-100 rounded-2xl border border-dashed border-base-300 text-center print:hidden">
        <Music2 className="w-10 h-10 text-base-content/30 mb-2" />
        <h3 className="font-bold text-sm text-base-content/80">
          Nenhuma nota adicionada ainda
        </h3>
        <p className="text-xs text-base-content/60 max-w-sm mt-1">
          Insira notas usando os botões acima ou digite no editor para configurar a duração individual de cada nota.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-sm print:hidden">
      {/* Header with Title and Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎼</span>
          <div>
            <h3 className="font-black text-sm text-base-content leading-tight flex items-center gap-2">
              Linha do Tempo & Configuração Individual de Duração por Nota
              <span className="badge badge-primary badge-sm font-mono font-bold">
                {tokens.length} {tokens.length === 1 ? 'nota' : 'notas'}
              </span>
            </h3>
            <p className="text-xs text-base-content/60">
              Ajuste o tempo específico de cada nota na melodia (Semibreve, Mínima, Semínima ou Colcheia)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="badge badge-neutral badge-outline font-mono text-xs gap-1.5 py-2.5 px-3">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>
              Total: <strong>{totalBeats} tempos</strong> (~{estimatedDurationSeconds}s)
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Note Cards Sequence */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin px-0.5">
        {tokens.map((token) => {
          const isCurrent = activePlaybackIndex === token.index;
          const durInfo = formatDurationLabel(token.beats);

          return (
            <div
              key={token.id}
              className={`flex-shrink-0 w-36 sm:w-40 flex flex-col justify-between p-3 rounded-2xl border-2 transition-all ${
                isCurrent
                  ? 'border-primary ring-4 ring-primary/30 bg-primary/10 shadow-lg scale-105'
                  : 'border-base-200 bg-base-200/30 hover:border-primary/40 hover:bg-base-200/60 shadow-sm'
              }`}
            >
              {/* Card Top: Index, Label, Delete */}
              <div className="flex items-center justify-between border-b border-base-300/60 pb-1.5 mb-1.5">
                <span className="badge badge-ghost badge-xs font-mono font-bold opacity-75">
                  #{token.index + 1}
                </span>

                <div className="flex items-center gap-1 font-black text-sm">
                  {token.isRest ? (
                    <span className="text-warning">Pausa</span>
                  ) : (
                    <span className={token.note?.isAccidental ? 'text-secondary' : 'text-primary'}>
                      {token.note?.label || token.char}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(token)}
                  className="btn btn-ghost btn-xs btn-circle text-error/60 hover:text-error hover:bg-error/10"
                  title="Remover esta nota"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Note Diagram or Rest Icon */}
              <div className="flex flex-col items-center justify-center py-1">
                {token.note ? (
                  <OcarinaDiagram
                    holes={token.note.holes}
                    size={46}
                    fillColor="#1e293b"
                    outlineColor="#475569"
                    holeOpenColor="#ffffff"
                  />
                ) : (
                  <div className="h-[46px] flex items-center justify-center text-2xl opacity-60">
                    ⏸️
                  </div>
                )}
                <span className="text-[11px] font-mono text-base-content/60 mt-1">
                  Tecla: <strong>{token.char}</strong>
                </span>
              </div>

              {/* Current Duration Display */}
              <div className="my-1.5 bg-base-100 p-1.5 rounded-xl border border-base-300/80 text-center shadow-xs">
                <div className="flex items-center justify-center gap-1 text-primary font-bold text-xs">
                  <span className="text-base leading-none font-serif">{durInfo.symbol}</span>
                  <span>{durInfo.namePt}</span>
                </div>
              </div>

              {/* Quick Stepper: - and + */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => handleAdjustDuration(token, -1)}
                  disabled={token.beats <= 0.5}
                  className="btn btn-xs btn-square btn-outline border-base-300 hover:btn-primary"
                  title="Diminuir 1 tempo (-)"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="text-xs font-mono font-bold text-base-content/80">
                  {token.beats} {token.beats === 1 ? 'tempo' : 'tempos'}
                </span>

                <button
                  type="button"
                  onClick={() => handleAdjustDuration(token, 1)}
                  disabled={token.beats >= 8}
                  className="btn btn-xs btn-square btn-outline border-base-300 hover:btn-primary"
                  title="Aumentar 1 tempo (+)"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Preset Duration Buttons: 4t, 2t, 1t, 0.5t */}
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => handleSetDuration(token, 4)}
                  className={`btn btn-xs px-0.5 text-[10px] font-bold ${
                    token.beats === 4 ? 'btn-primary' : 'btn-ghost border border-base-300/80'
                  }`}
                  title="Semibreve (4 tempos)"
                >
                  4t
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDuration(token, 2)}
                  className={`btn btn-xs px-0.5 text-[10px] font-bold ${
                    token.beats === 2 ? 'btn-primary' : 'btn-ghost border border-base-300/80'
                  }`}
                  title="Mínima (2 tempos)"
                >
                  2t
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDuration(token, 1)}
                  className={`btn btn-xs px-0.5 text-[10px] font-bold ${
                    token.beats === 1 ? 'btn-primary' : 'btn-ghost border border-base-300/80'
                  }`}
                  title="Semínima (1 tempo)"
                >
                  1t
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDuration(token, 0.5)}
                  className={`btn btn-xs px-0.5 text-[10px] font-bold ${
                    token.beats === 0.5 ? 'btn-primary' : 'btn-ghost border border-base-300/80'
                  }`}
                  title="Colcheia (1/2 tempo)"
                >
                  ½t
                </button>
              </div>

              {/* Preview Button */}
              {token.note && (
                <button
                  type="button"
                  onClick={() => handlePreviewNote(token)}
                  className="btn btn-xs btn-ghost hover:btn-primary mt-2 gap-1 text-[11px] font-medium border border-base-300/60"
                  title="Tocar áudio desta nota com sua duração"
                >
                  <Play className="w-3 h-3 text-primary" />
                  Ouvir
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-base-content/60 px-1 pt-1 border-t border-base-200">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          Dica: Ao alterar o tempo de uma nota, a tablatura atualiza automaticamente os hífens de sustentação (–).
        </span>
        <span className="hidden sm:inline font-mono">
          4t = – – –, 2t = –, 1t = sem hífen
        </span>
      </div>
    </div>
  );
};
