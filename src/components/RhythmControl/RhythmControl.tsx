import React, { useState, useEffect, useRef } from 'react';
import { DURATION_OPTIONS } from '../../constants/ocarinaData';
import type { DurationOption, OcarinaKey } from '../../types/ocarina';
import { parseTabForPlayback } from '../../utils/ocarinaParser';
import { playMetronomeClick, playOcarinaFrequency } from '../../audio/ocarinaAudio';
import { Play, Pause, Square, Repeat, Clock, Timer } from 'lucide-react';

export interface RhythmControlProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  selectedDuration: DurationOption;
  onSelectDuration: (dur: DurationOption) => void;
  autoSustainEnabled: boolean;
  onToggleAutoSustain: (enabled: boolean) => void;
  tabText: string;
  ocarinaKey: OcarinaKey;
  soundEnabled: boolean;
  onPlayingIndexChange?: (index: number | null) => void;
}

export const RhythmControl: React.FC<RhythmControlProps> = ({
  bpm,
  onBpmChange,
  selectedDuration,
  onSelectDuration,
  autoSustainEnabled,
  onToggleAutoSustain,
  tabText,
  ocarinaKey,
  soundEnabled,
  onPlayingIndexChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [, setActivePlaybackIndex] = useState<number | null>(null);

  const tapTimesRef = useRef<number[]>([]);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSoundStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (currentSoundStopRef.current) {
      currentSoundStopRef.current();
      currentSoundStopRef.current = null;
    }
    setIsPlaying(false);
    setActivePlaybackIndex(null);
    onPlayingIndexChange?.(null);
  };

  const startPlayback = () => {
    const items = parseTabForPlayback(tabText, ocarinaKey);
    if (items.length === 0) return;

    setIsPlaying(true);
    let stepIndex = 0;

    const playStep = () => {
      if (stepIndex >= items.length) {
        if (isLooping) {
          stepIndex = 0;
        } else {
          stopPlayback();
          return;
        }
      }

      const item = items[stepIndex];
      setActivePlaybackIndex(item.index);
      onPlayingIndexChange?.(item.index);

      const secondsPerBeat = 60 / bpm;
      const durationSec = item.durationBeats * secondsPerBeat;

      if (metronomeEnabled) {
        playMetronomeClick(stepIndex % 4 === 0);
      }

      if (!item.isRest && item.note && soundEnabled) {
        const sound = playOcarinaFrequency(item.note.frequency, durationSec * 0.95);
        currentSoundStopRef.current = sound.stop;
      }

      stepIndex++;
      playbackTimerRef.current = setTimeout(playStep, durationSec * 1000);
    };

    playStep();
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    if (times.length > 0 && now - times[times.length - 1] > 2500) {
      times.length = 0;
    }
    times.push(now);
    if (times.length > 4) times.shift();

    if (times.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        onBpmChange(calculatedBpm);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏱️</span>
          <div>
            <h4 className="font-bold text-sm text-base-content leading-tight">
              Tempo & Andamento Musical
            </h4>
            <p className="text-xs text-base-content/60">
              Marque o tempo das notas e reproduza a melodia no andamento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={`btn btn-sm gap-1.5 shadow-sm ${
              isPlaying ? 'btn-warning' : 'btn-primary'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pausar' : 'Tocar Tablatura'}
          </button>

          <button
            onClick={stopPlayback}
            disabled={!isPlaying}
            className="btn btn-sm btn-ghost btn-square"
            title="Parar reprodução"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`btn btn-sm btn-square ${isLooping ? 'btn-active btn-neutral' : 'btn-ghost'}`}
            title="Repetir em loop"
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className={`btn btn-sm btn-square ${metronomeEnabled ? 'btn-active btn-neutral' : 'btn-ghost'}`}
            title="Clique de metrônomo"
          >
            <Timer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-base-200">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-base-content/70">
              Duração da Nota ao Inserir:
            </span>
            <label className="label cursor-pointer p-0 gap-1.5">
              <span className="text-xs text-base-content/60">Duração automática:</span>
              <input
                type="checkbox"
                checked={autoSustainEnabled}
                onChange={(e) => onToggleAutoSustain(e.target.checked)}
                className="toggle toggle-primary toggle-xs"
              />
            </label>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {DURATION_OPTIONS.map((dur) => (
              <button
                key={dur.id}
                onClick={() => onSelectDuration(dur)}
                className={`btn btn-xs flex flex-col py-1 h-auto text-center rounded-lg transition-all ${
                  selectedDuration.id === dur.id
                    ? 'btn-primary shadow-sm'
                    : 'btn-outline border-base-300'
                }`}
                title={dur.namePt}
              >
                <span className="text-base leading-none font-serif">{dur.symbol}</span>
                <span className="text-[10px] font-mono leading-none">{dur.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-base-content/50 mt-1">
            Selecionado: <strong>{selectedDuration.namePt}</strong> ({selectedDuration.beats} tempos)
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-base-content/70">
              Andamento (BPM): <strong className="text-primary font-mono text-sm">{bpm}</strong>
            </span>
            <button
              onClick={handleTapTempo}
              className="btn btn-xs btn-outline btn-secondary gap-1"
              title="Clique repetidamente no compasso desejado"
            >
              <Clock className="w-3 h-3" /> Tap Tempo
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onBpmChange(Math.max(40, bpm - 5))}
              className="btn btn-xs btn-circle btn-ghost"
            >
              -
            </button>
            <input
              type="range"
              min="40"
              max="220"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="range range-primary range-xs flex-1"
            />
            <button
              onClick={() => onBpmChange(Math.min(240, bpm + 5))}
              className="btn btn-xs btn-circle btn-ghost"
            >
              +
            </button>
          </div>

          <div className="flex justify-between text-[10px] text-base-content/50 px-1 mt-1 font-mono">
            <span>Largo (50)</span>
            <span>Andante (80)</span>
            <span>Moderato (110)</span>
            <span>Allegro (140)</span>
            <span>Presto (180)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
