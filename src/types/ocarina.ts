export type OcarinaKey = 'C' | 'F' | 'G';
export type FontVariant = '1' | '2';
export type FontSizeUnit = 'px' | 'mm' | 'cm' | 'in' | 'pt' | 'pc';

export interface DurationOption {
  id: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
  label: string;
  namePt: string;
  beats: number;
  symbol: string;
  dashes: string;
}

export interface OcarinaNote {
  key: string;       // Caractere da fonte (ex: 'A', 'B', 'D')
  label: string;     // Rótulo musical (ex: 'C', 'D#', 'F²')
  holes: number[];   // Furos tapados (1 a 12)
  midi: number;      // Nota MIDI para cálculo de frequência
  frequency: number; // Hz
  isAccidental?: boolean;
}

export interface ExtraKey {
  key: string;
  label: string;
  title: string;
  isRest?: boolean;
  isModifier?: boolean;
}

export interface SampleSong {
  id: string;
  title: string;
  key: OcarinaKey;
  bpm: number;
  font: FontVariant;
  fontSize: number;
  fontSizeUnit: FontSizeUnit;
  tabs: string;
  description: string;
}

export interface TabPlaybackItem {
  char: string;
  note?: OcarinaNote;
  isRest: boolean;
  isSustain: boolean;
  durationBeats: number;
  index: number;
}

export type ButtonScale = 'sm' | 'md' | 'lg';

export interface ParsedNoteToken {
  id: string;
  char: string;
  note?: OcarinaNote;
  isRest: boolean;
  beats: number;
  rawText: string;
  startIndex: number;
  endIndex: number;
  index: number;
}

