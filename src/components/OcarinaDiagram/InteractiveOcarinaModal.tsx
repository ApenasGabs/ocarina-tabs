import React, { useState, useMemo } from 'react';
import { OcarinaDiagram } from './OcarinaDiagram';
import { getNotesForKey } from '../../constants/ocarinaData';
import type { OcarinaKey, OcarinaNote } from '../../types/ocarina';
import { playOcarinaFrequency } from '../../audio/ocarinaAudio';
import { X, Volume2, Sparkles, Plus, RefreshCw } from 'lucide-react';

export interface InteractiveOcarinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocarinaKey: OcarinaKey;
  onInsertNote: (note: OcarinaNote) => void;
}

export const InteractiveOcarinaModal: React.FC<InteractiveOcarinaModalProps> = ({
  isOpen,
  onClose,
  ocarinaKey,
  onInsertNote,
}) => {
  const [coveredHoles, setCoveredHoles] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  const { all } = useMemo(() => getNotesForKey(ocarinaKey), [ocarinaKey]);

  // Find note that matches current covered holes
  const matchedNote = useMemo(() => {
    const currentSorted = [...coveredHoles].sort((a, b) => a - b).join(',');
    return all.find((n) => [...n.holes].sort((a, b) => a - b).join(',') === currentSorted);
  }, [coveredHoles, all]);

  if (!isOpen) return null;

  const handleToggleHole = (holeId: number) => {
    setCoveredHoles((prev) => {
      const next = prev.includes(holeId) ? prev.filter((id) => id !== holeId) : [...prev, holeId];
      // Play sound if match found
      const currentSorted = [...next].sort((a, b) => a - b).join(',');
      const match = all.find((n) => [...n.holes].sort((a, b) => a - b).join(',') === currentSorted);
      if (match) {
        playOcarinaFrequency(match.frequency, 0.4);
      }
      return next;
    });
  };

  const handlePlaySound = () => {
    if (matchedNote) {
      playOcarinaFrequency(matchedNote.frequency, 0.6);
    }
  };

  const handleInsert = () => {
    if (matchedNote) {
      onInsertNote(matchedNote);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-base-100 rounded-3xl max-w-xl w-full p-6 border border-base-200 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-200 pb-3">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Sparkles className="w-5 h-5 text-secondary" />
            <span>Ocarina Virtual Interativa</span>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost" title="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions */}
        <p className="text-xs text-base-content/70">
          Toque diretamente nos furos (1 a 12) da ocarina para abrir ou fechar. O sistema detectará automaticamente qual nota musical corresponde à posição dos seus dedos!
        </p>

        {/* Diagram & Matched Note */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4 bg-base-200/50 rounded-2xl border border-base-300">
          <OcarinaDiagram
            holes={coveredHoles}
            size={220}
            interactive={true}
            showLabels={true}
            onToggleHole={handleToggleHole}
            bodyColor="var(--color-primary, #6366f1)"
            closedHoleColor="#0f172a"
            openHoleColor="#ffffff"
          />

          <div className="flex flex-col items-center sm:items-start gap-3">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">
                Nota Identificada:
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2 mt-0.5">
                {matchedNote ? (
                  <>
                    <span>{matchedNote.label}</span>
                    <span className="text-sm font-normal text-base-content/60">
                      ({matchedNote.frequency} Hz)
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-warning">
                    Posição não-padrão
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                {coveredHoles.length} de 12 furos fechados
              </p>
            </div>

            {matchedNote && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlaySound}
                  className="btn btn-sm btn-outline btn-primary gap-1.5"
                  title="Ouvir esta nota"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsert}
                  className="btn btn-sm btn-primary gap-1.5"
                  title="Inserir na tablatura"
                >
                  <Plus className="w-4 h-4" />
                  <span>Inserir Nota</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCoveredHoles([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
              className="btn btn-xs btn-outline"
            >
              Fechar Todos
            </button>
            <button
              type="button"
              onClick={() => setCoveredHoles([])}
              className="btn btn-xs btn-outline"
            >
              Abrir Todos
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCoveredHoles([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}
            className="btn btn-xs btn-ghost text-base-content/70 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Furos Principais
          </button>
        </div>
      </div>
    </div>
  );
};
