import { getNotesForKey } from '../constants/ocarinaData';
import type { OcarinaKey } from '../types/ocarina';
import { parseTabTokens } from './ocarinaParser';

/**
 * Converte número MIDI para nota e oitava em ABC Notation
 * Standard ABC:
 * C4 (60) = C, D4 (62) = D ... B4 (71) = B
 * C5 (72) = c, D5 (74) = d ... B5 (83) = b
 * C6 (84) = c', D6 (86) = d' ... B6 (95) = b'
 * C7 (96) = c''
 */
export function midiToAbcPitch(midi: number): string {
  const noteNames = [
    { base: 'C', acc: '' },
    { base: 'C', acc: '^' },
    { base: 'D', acc: '' },
    { base: 'D', acc: '^' },
    { base: 'E', acc: '' },
    { base: 'F', acc: '' },
    { base: 'F', acc: '^' },
    { base: 'G', acc: '' },
    { base: 'G', acc: '^' },
    { base: 'A', acc: '' },
    { base: 'A', acc: '^' },
    { base: 'B', acc: '' },
  ];

  const semitone = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1; // 60 -> C4
  const { base, acc } = noteNames[semitone];

  if (octave <= 3) {
    const commas = ','.repeat(Math.max(1, 4 - octave));
    return `${acc}${base}${commas}`;
  } else if (octave === 4) {
    return `${acc}${base}`;
  } else if (octave === 5) {
    return `${acc}${base.toLowerCase()}`;
  } else {
    const apostrophes = "'".repeat(octave - 5);
    return `${acc}${base.toLowerCase()}${apostrophes}`;
  }
}

/**
 * Converte notas ABC para semitons/MIDI
 */
const BASE_PITCH_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
  c: 12,
  d: 14,
  e: 16,
  f: 17,
  g: 19,
  a: 21,
  b: 23,
};

// Armaduras de clave comuns em ABC Notation para aplicar acidentes automáticos
const KEY_ACCIDENTALS: Record<string, Record<string, number>> = {
  C: {},
  Am: {},
  G: { F: 1 },
  Em: { F: 1 },
  D: { F: 1, C: 1 },
  Bm: { F: 1, C: 1 },
  A: { F: 1, C: 1, G: 1 },
  'F#m': { F: 1, C: 1, G: 1 },
  E: { F: 1, C: 1, G: 1, D: 1 },
  F: { B: -1 },
  Dm: { B: -1 },
  Bb: { B: -1, E: -1 },
  Gm: { B: -1, E: -1 },
  Eb: { B: -1, E: -1, A: -1 },
  Cm: { B: -1, E: -1, A: -1 },
};

export interface AbcExportOptions {
  title: string;
  tabText: string;
  ocarinaKey: OcarinaKey;
  bpm?: number;
  meter?: string;
  unitNoteLength?: string;
}

/**
 * Exporta a tablatura atual para formato padrão ABC Notation (.abc)
 */
export function exportToAbc({
  title,
  tabText,
  ocarinaKey,
  bpm = 120,
  meter = '4/4',
  unitNoteLength = '1/4',
}: AbcExportOptions): string {
  const lines = tabText.split('\n');
  const abcLines: string[] = [
    'X: 1',
    `T: ${title || 'Ocarina Tab'}`,
    `M: ${meter}`,
    `L: ${unitNoteLength}`,
    `Q: 1/4=${bpm}`,
    `K: ${ocarinaKey}`,
    '% Transcrição gerada pelo Ocarina Tabs Studio',
  ];

  for (const line of lines) {
    if (!line.trim()) {
      abcLines.push('');
      continue;
    }

    const tokens = parseTabTokens(line, ocarinaKey);
    let abcLine = '';

    for (const token of tokens) {
      let durationStr = '';
      if (token.beats === 1) {
        durationStr = '';
      } else if (token.beats === 2) {
        durationStr = '2';
      } else if (token.beats === 3) {
        durationStr = '3';
      } else if (token.beats === 4) {
        durationStr = '4';
      } else if (token.beats === 0.5) {
        durationStr = '/2';
      } else if (token.beats === 0.25) {
        durationStr = '/4';
      } else {
        durationStr = String(token.beats);
      }

      if (token.isRest) {
        abcLine += `z${durationStr} `;
      } else if (token.note) {
        const pitch = midiToAbcPitch(token.note.midi);
        abcLine += `${pitch}${durationStr} `;
      }
    }

    if (abcLine.trim()) {
      abcLines.push(abcLine.trim());
    }
  }

  return abcLines.join('\n');
}

export interface AbcParsedResult {
  title: string;
  ocarinaKey: OcarinaKey;
  bpm: number;
  meter: string;
  tabText: string;
  detectedKeySignature: string;
  notesCount: number;
  warnings: string[];
}

/**
 * Detecta se o texto fornecido parece ser ABC Notation
 */
export function isAbcNotation(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  // Verifica cabeçalhos ABC clássicos (X:, T:, K:, M:, Q:, L:)
  const hasHeaders = /(?:^|\n)\s*(?:X|T|K|M|Q|L)\s*:\s*[^\n]+/i.test(text);
  if (hasHeaders) return true;

  // Ou corpo com sintaxe de partitura ABC típica (compassos com notas e acidentes)
  const hasAbcBody = /\|[:|]?\s*[\^_=]?[a-gA-G][',0-9/]*\s+[\^_=]?[a-gA-G]/.test(text);
  return hasAbcBody;
}

/**
 * Analisa e converte notação ABC para Tablatura de Ocarina
 */
export function parseAbc(
  abcContent: string,
  targetKeyPreference?: OcarinaKey
): AbcParsedResult {
  const warnings: string[] = [];
  let title = 'Canção ABC Importada';
  let bpm = 120;
  let meter = '4/4';
  let unitLength = '1/4';
  let keySig = 'C';
  const bodyLines: string[] = [];

  const rawLines = abcContent.split(/\r?\n/);
  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%')) {
      continue;
    }

    const headerMatch = /^([A-Za-z]):\s*(.*)$/.exec(line);
    if (headerMatch) {
      const type = headerMatch[1].toUpperCase();
      const val = headerMatch[2].trim();

      if (type === 'T' && (!title || title === 'Canção ABC Importada')) {
        title = val;
      } else if (type === 'M') {
        meter = val;
      } else if (type === 'L') {
        unitLength = val;
      } else if (type === 'Q') {
        const bpmMatch = /(\d+)\s*$/.exec(val);
        if (bpmMatch) {
          bpm = Number(bpmMatch[1]);
        }
      } else if (type === 'K') {
        // Tom da canção (ex: K: G, K: Dm, K: C)
        const km = /^([A-G][#b]?(?:m|maj|min)?)/i.exec(val);
        if (km) {
          keySig = km[1];
        }
      }
      continue;
    }

    // Linha de corpo musical
    bodyLines.push(line);
  }

  // Define a tonalidade da ocarina
  let ocarinaKey: OcarinaKey = targetKeyPreference || 'C';
  if (!targetKeyPreference) {
    if (keySig.toUpperCase().startsWith('F')) ocarinaKey = 'F';
    else if (keySig.toUpperCase().startsWith('G')) ocarinaKey = 'G';
    else ocarinaKey = 'C';
  }

  // Fator de conversão da unidade L para semínimas (beats)
  let unitFactor = 1;
  if (unitLength === '1/8') unitFactor = 0.5;
  else if (unitLength === '1/16') unitFactor = 0.25;
  else if (unitLength === '1/2') unitFactor = 2;
  else if (unitLength === '1/1') unitFactor = 4;

  const keyAccidentals = KEY_ACCIDENTALS[keySig] || {};
  const notesForKey = getNotesForKey(ocarinaKey);
  const playableNotes = notesForKey.all;

  // Primeiro passo: extrair todos os eventos (notas MIDI e pausas com durações)
  interface NoteEvent {
    isRest: boolean;
    isBar: boolean;
    isNewline: boolean;
    midi?: number;
    beats: number;
  }

  const events: NoteEvent[] = [];

  for (const line of bodyLines) {
    // Regex para capturar notas, pausas, compassos e acidentes em ABC
    // Grupos:
    // 1: acidente (^, ^^, _, __, =)
    // 2: nota base (A-G ou a-g)
    // 3: oitava (', ,, etc.)
    // 4: duração (/2, 2, 3/4, etc.)
    // ou Pausa: z, x
    // ou Barra: |
    const tokenRegex = /([_\\^=]*)([A-Ga-g])(['+,]*)([0-9]*\/?[0-9]*)|([zx])([0-9]*\/?[0-9]*)|(\|{1,2}|:\||\|:)/g;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match[7]) {
        // Barra de compasso
        events.push({ isRest: false, isBar: true, isNewline: false, beats: 0 });
        continue;
      }

      if (match[5]) {
        // Pausa (z ou x)
        const durStr = match[6] || '';
        const beats = parseAbcDuration(durStr, unitFactor);
        events.push({ isRest: true, isBar: false, isNewline: false, beats });
        continue;
      }

      const accStr = match[1] || '';
      const baseNote = match[2];
      const octStr = match[3] || '';
      const durStr = match[4] || '';

      if (baseNote) {
        let midi = 60 + (BASE_PITCH_SEMITONES[baseNote] || 0);

        // Oitavas por ' ou ,
        if (octStr) {
          for (const char of octStr) {
            if (char === "'") midi += 12;
            else if (char === ',') midi -= 12;
          }
        }

        // Acidentes explícitos
        if (accStr === '^') midi += 1;
        else if (accStr === '^^') midi += 2;
        else if (accStr === '_') midi -= 1;
        else if (accStr === '__') midi -= 2;
        else if (accStr !== '=') {
          // Aplica acidente da armadura de clave se não foi explicitamente anulado por '='
          const upperBase = baseNote.toUpperCase();
          if (keyAccidentals[upperBase]) {
            midi += keyAccidentals[upperBase];
          }
        }

        const beats = parseAbcDuration(durStr, unitFactor);
        events.push({ isRest: false, isBar: false, isNewline: false, midi, beats });
      }
    }

    events.push({ isRest: false, isBar: false, isNewline: true, beats: 0 });
  }

  // Otimização de Oitava: Encontra o deslocamento (-24, -12, 0, +12, +24) que abrange mais notas na ocarina
  const playableMidis = new Set(playableNotes.map((n) => n.midi));
  const noteEvents = events.filter((e) => !e.isRest && !e.isBar && !e.isNewline && e.midi !== undefined);

  let bestShift = 0;
  let maxMatched = -1;

  for (const shift of [0, 12, -12, 24, -24]) {
    let matched = 0;
    for (const ev of noteEvents) {
      if (ev.midi !== undefined && playableMidis.has(ev.midi + shift)) {
        matched++;
      }
    }
    if (matched > maxMatched) {
      maxMatched = matched;
      bestShift = shift;
    }
  }

  // Segundo passo: Mapear para caracteres de fonte da Ocarina
  let resultTab = '';
  let currentLine = '';
  let notesCount = 0;

  for (const ev of events) {
    if (ev.isNewline) {
      if (currentLine.trim()) {
        resultTab += (resultTab ? '\n' : '') + currentLine.trim();
        currentLine = '';
      }
      continue;
    }

    if (ev.isBar) {
      currentLine += ' | ';
      continue;
    }

    const dashes = formatDashesForBeats(ev.beats);

    if (ev.isRest) {
      currentLine += `r${dashes} `;
      continue;
    }

    if (ev.midi !== undefined) {
      const targetMidi = ev.midi + bestShift;
      // Procura nota exata ou a mais próxima no alcance
      let matchedNote = playableNotes.find((n) => n.midi === targetMidi);
      if (!matchedNote) {
        // Encontra nota mais próxima
        let minDiff = 999;
        for (const n of playableNotes) {
          const diff = Math.abs(n.midi - targetMidi);
          if (diff < minDiff) {
            minDiff = diff;
            matchedNote = n;
          }
        }
      }

      if (matchedNote) {
        currentLine += `${matchedNote.key}${dashes} `;
        notesCount++;
      }
    }
  }

  if (currentLine.trim()) {
    resultTab += (resultTab ? '\n' : '') + currentLine.trim();
  }

  if (bestShift !== 0) {
    const octWord = bestShift > 0 ? `+${bestShift / 12} oitava(s)` : `${bestShift / 12} oitava(s)`;
    warnings.push(`As notas foram ajustadas automaticamente (${octWord}) para caber na extensão da ocarina.`);
  }

  return {
    title,
    ocarinaKey,
    bpm,
    meter,
    tabText: resultTab || 'D - F - H - - -',
    detectedKeySignature: keySig,
    notesCount,
    warnings,
  };
}

function parseAbcDuration(durStr: string, unitFactor: number): number {
  if (!durStr) return 1 * unitFactor;
  if (durStr === '/') return 0.5 * unitFactor;
  if (durStr.startsWith('/')) {
    const denom = Number(durStr.slice(1)) || 2;
    return (1 / denom) * unitFactor;
  }
  if (durStr.includes('/')) {
    const [num, denom] = durStr.split('/').map(Number);
    return ((num || 1) / (denom || 2)) * unitFactor;
  }
  return (Number(durStr) || 1) * unitFactor;
}

function formatDashesForBeats(beats: number): string {
  const roundedBeats = Math.round(beats);
  if (roundedBeats <= 1) return '';
  const numDashes = Math.max(0, roundedBeats - 1);
  return ' ' + Array(numDashes).fill('-').join(' ');
}
