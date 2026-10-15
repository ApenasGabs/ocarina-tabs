import React, { useState, useMemo } from 'react';
import { OcarinaDiagram } from '../OcarinaDiagram/OcarinaDiagram';
import { getNotesForKey } from '../../constants/ocarinaData';
import type { OcarinaKey, OcarinaNote } from '../../types/ocarina';
import { playOcarinaFrequency } from '../../audio/ocarinaAudio';
import { Sparkles, Volume2, Search } from 'lucide-react';

export interface VisualPickerProps {
  ocarinaKey: OcarinaKey;
  onSelectNote: (note: OcarinaNote) => void;
  onOpenInteractiveModal?: () => void;
  soundEnabled?: boolean;
}

export const VisualPicker: React.FC<VisualPickerProps> = ({
  ocarinaKey,
  onSelectNote,
  onOpenInteractiveModal,
  soundEnabled = true,
}) => {
  const [filter, setFilter] = useState<'all' | 'naturals' | 'accidentals'>('all');
  const [search, setSearch] = useState('');

  const { naturals, accidentals, all } = useMemo(() => getNotesForKey(ocarinaKey), [ocarinaKey]);

  const displayedNotes = useMemo(() => {
    let list = all;
    if (filter === 'naturals') list = naturals;
    else if (filter === 'accidentals') list = accidentals;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) => n.label.toLowerCase().includes(q) || n.key.toLowerCase().includes(q)
      );
    }
    return list;
  }, [all, naturals, accidentals, filter, search]);

  const handleCardClick = (note: OcarinaNote) => {
    if (soundEnabled) {
      playOcarinaFrequency(note.frequency, 0.45);
    }
    onSelectNote(note);
  };

  const handlePreviewAudio = (e: React.MouseEvent, note: OcarinaNote) => {
    e.stopPropagation();
    playOcarinaFrequency(note.frequency, 0.6);
  };

  return (
    <div className="flex flex-col gap-4 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
      {/* Top Bar with Filters and Interactive Explorer CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">👀</span>
          <div>
            <h4 className="font-bold text-sm text-base-content leading-tight">
              Seletor Visual de Digitação (Furinhos)
            </h4>
            <p className="text-xs text-base-content/60">
              Escolha a nota olhando diretamente a posição dos dedos na ocarina
            </p>
          </div>
        </div>

        {onOpenInteractiveModal && (
          <button
            onClick={onOpenInteractiveModal}
            className="btn btn-outline btn-primary btn-sm gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Explorador Interativo de Furos
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-base-200">
        <div className="join join-horizontal">
          <button
            onClick={() => setFilter('all')}
            className={`btn btn-xs join-item ${filter === 'all' ? 'btn-active btn-neutral' : 'btn-ghost'}`}
          >
            Todas ({all.length})
          </button>
          <button
            onClick={() => setFilter('naturals')}
            className={`btn btn-xs join-item ${filter === 'naturals' ? 'btn-active btn-neutral' : 'btn-ghost'}`}
          >
            Naturais ({naturals.length})
          </button>
          <button
            onClick={() => setFilter('accidentals')}
            className={`btn btn-xs join-item ${filter === 'accidentals' ? 'btn-active btn-neutral' : 'btn-ghost'}`}
          >
            Acidentes ♯ ({accidentals.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar nota..."
            className="input input-xs input-bordered pl-8 w-32 focus:w-40 transition-all rounded-lg"
          />
        </div>
      </div>

      {/* Grid of Ocarina Visual Fingerings */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[360px] overflow-y-auto p-1 scrollbar-thin">
        {displayedNotes.map((note) => (
          <button
            key={note.key}
            onClick={() => handleCardClick(note)}
            className="group relative flex flex-col items-center justify-between p-2.5 rounded-xl border border-base-200 bg-base-200/40 hover:bg-base-200 hover:border-primary/50 hover:shadow-md transition-all active:scale-95 text-left"
            title={`Inserir ${note.label} (${note.frequency} Hz) - ${note.holes.length} furos fechados`}
          >
            {/* Note badge */}
            <div className="w-full flex items-center justify-between mb-1">
              <span className={`font-black text-sm ${note.isAccidental ? 'text-secondary' : 'text-primary'}`}>
                {note.label}
              </span>
              <span
                onClick={(e) => handlePreviewAudio(e, note)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-primary transition-opacity"
                title="Tocar áudio da nota"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Ocarina Diagram */}
            <div className="py-1">
              <OcarinaDiagram
                holes={note.holes}
                size={58}
                fillColor="#1e293b"
                outlineColor="#475569"
                holeOpenColor="#ffffff"
              />
            </div>

            {/* Subtitle / Holes count */}
            <div className="w-full text-center mt-1 pt-1 border-t border-base-300/40 flex items-center justify-between text-[10px] text-base-content/60 font-mono">
              <span>{note.holes.length} furos</span>
              <span>{note.key}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
