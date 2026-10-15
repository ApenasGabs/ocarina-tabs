import { useState, useEffect, useRef, useCallback } from 'react';
import type { OcarinaKey } from '../types/ocarina';
import { parseTabForPlayback } from '../utils/ocarinaParser';
import { playMetronomeClick, playOcarinaFrequency } from '../audio/ocarinaAudio';

export interface UseTabPlaybackProps {
  tabText: string;
  ocarinaKey: OcarinaKey;
  bpm: number;
  soundEnabled: boolean;
  onPlayingIndexChange?: (index: number | null) => void;
}

export function useTabPlayback({
  tabText,
  ocarinaKey,
  bpm,
  soundEnabled,
  onPlayingIndexChange,
}: UseTabPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number | null>(null);

  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSoundStopRef = useRef<(() => void) | null>(null);

  const stopPlayback = useCallback(() => {
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
  }, [onPlayingIndexChange]);

  const startPlayback = useCallback(() => {
    const items = parseTabForPlayback(tabText, ocarinaKey);
    if (items.length === 0) return;

    if (currentSoundStopRef.current) {
      currentSoundStopRef.current();
      currentSoundStopRef.current = null;
    }

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
  }, [tabText, ocarinaKey, bpm, soundEnabled, isLooping, metronomeEnabled, onPlayingIndexChange, stopPlayback]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return {
    isPlaying,
    isLooping,
    setIsLooping,
    metronomeEnabled,
    setMetronomeEnabled,
    activePlaybackIndex,
    startPlayback,
    stopPlayback,
    togglePlay,
  };
}
