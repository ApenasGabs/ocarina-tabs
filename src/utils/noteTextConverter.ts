import { getNotesForKey } from '../constants/ocarinaData';
import type { OcarinaKey, OcarinaNote } from '../types/ocarina';

export type NoteNotationType = 'anglo' | 'solfege' | 'unknown';

export interface NoteTextParseResult {
  tabText: string;
  detectedNotation: NoteNotationType;
  notesCount: number;
  unrecognizedTokens: string[];
}

// Mapeamento de nomes de notas solfejo para semitons dentro da oitava (C=0)
const SOLFEGE_MAP: Record<string, number> = {
  DO: 0,
  DÓ: 0,
  RE: 2,
  RÉ: 2,
  MI: 4,
  FA: 5,
  FÁ: 5,
  SOL: 7,
  SO: 7,
  LA: 9,
  LÁ: 9,
  SI: 11,
  TI: 11,
};

// Mapeamento anglo-saxão básico (C=0)
const ANGLO_MAP: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * Normaliza strings com acentos
 */
function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Detecta se o texto consiste primariamente em nomes de notas (anglo ou solfejo)
 */
export function isNoteText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  // Se tem caracteres exclusivos da fonte da ocarina (H, K, M, O, P, R, T, U) em grande volume e sem formato de notas, provavelmente já é ocarina
  // Se tem cabeçalhos ABC (X:, T:, K:), é ABC
  if (/(?:^|\n)\s*(?:X|T|K|M|Q|L)\s*:\s*[^\n]+/i.test(text)) return false;

  const words = text
    .trim()
    .split(/[\s,|\n]+/)
    .filter(Boolean);
  if (words.length === 0) return false;

  let solfegeHits = 0;
  let angloHits = 0;
  let ocarinaExclusiveGlyphs = 0;

  for (const w of words) {
    const clean = removeDiacritics(w.toUpperCase()).replace(/[^A-Z0-9#b]/g, '');
    if (!clean) continue;

    // Checa caracteres exclusivos de ocarina tab (H, K, M, N, O, P, Q, R, S, T, U)
    if (/^[HKMNOPQRSTU]$/.test(clean)) {
      ocarinaExclusiveGlyphs++;
    }

    if (/^(DO|RE|MI|FA|SOL|LA|SI|TI)[#b]?[0-9]?$/i.test(clean)) {
      solfegeHits++;
    } else if (/^[A-G][#b♯♭]?[0-9]?$/i.test(clean)) {
      angloHits++;
    }
  }

  // Se mais da metade dos caracteres isolados forem da fonte da ocarina, é tablatura de ocarina
  if (ocarinaExclusiveGlyphs > words.length * 0.3) {
    return false;
  }

  return solfegeHits >= 2 || (angloHits >= 2 && angloHits > words.length * 0.3);
}

/**
 * Converte texto livre contendo cifras ou nomes de notas para tablatura de ocarina
 */
export function parseNoteText(
  rawText: string,
  ocarinaKey: OcarinaKey = 'C'
): NoteTextParseResult {
  const { all: playableNotes } = getNotesForKey(ocarinaKey);
  const unrecognizedTokens: string[] = [];
  let notesCount = 0;
  let solfegeCount = 0;
  let angloCount = 0;

  const lines = rawText.split(/\r?\n/);
  const resultLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      resultLines.push('');
      continue;
    }

    // Preserva linhas de compasso ou comentários simples
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // Divide linha preservando traços de sustentação e barras de compasso
    // Ex: "C D E - G - - | C2 D2"
    const tokens = trimmed.split(/\s+/);
    let lineResult = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token === '|' || token === '||') {
        lineResult += (lineResult ? ' ' : '') + '|';
        continue;
      }

      if (token === '-' || token === '--' || token === '---') {
        lineResult += (lineResult ? ' ' : '') + token;
        continue;
      }

      if (/^(pausa|rest|silencio|r|z)$/i.test(token)) {
        lineResult += (lineResult ? ' ' : '') + 'r';
        continue;
      }

      // Tenta interpretar como solfejo ou anglo
      const parsed = parseSingleNoteToken(token);
      if (parsed) {
        if (parsed.type === 'solfege') solfegeCount++;
        else if (parsed.type === 'anglo') angloCount++;

        // Encontra a melhor nota correspondente na ocarina
        const matchedNote = findBestOcarinaNote(parsed.semitone, parsed.octave, playableNotes);
        if (matchedNote) {
          notesCount++;
          let noteOutput = matchedNote.key;

          // Se o token tiver duração implícita no número (ex: C2 = 2 tempos -> "D - ")
          if (parsed.durationBeats > 1) {
            const dashes = Array(parsed.durationBeats - 1).fill('-').join(' ');
            noteOutput += ` ${dashes}`;
          }

          lineResult += (lineResult ? ' ' : '') + noteOutput;
        } else {
          unrecognizedTokens.push(token);
        }
      } else {
        // Se for pontuação ou palavra não reconhecida
        if (/^[a-zA-Z0-9]+$/.test(token)) {
          unrecognizedTokens.push(token);
        }
      }
    }

    if (lineResult.trim()) {
      resultLines.push(lineResult.trim());
    }
  }

  const detectedNotation: NoteNotationType =
    solfegeCount >= angloCount && solfegeCount > 0
      ? 'solfege'
      : angloCount > 0
      ? 'anglo'
      : 'unknown';

  return {
    tabText: resultLines.join('\n'),
    detectedNotation,
    notesCount,
    unrecognizedTokens,
  };
}

interface ParsedTokenInfo {
  type: 'solfege' | 'anglo';
  semitone: number; // 0..11 relativo a C
  octave?: number;  // 4, 5, 6
  durationBeats: number;
}

function parseSingleNoteToken(token: string): ParsedTokenInfo | null {
  const clean = token.trim();
  if (!clean) return null;

  // 1. Tenta Solfejo (ex: Do, Dó, Re#, Mib, Sol5, La2)
  const solfegeMatch = /^([A-Za-zÀ-ÿ]{2,3})([#b♯♭]?)([0-9]?)$/i.exec(clean);
  if (solfegeMatch) {
    const rawName = solfegeMatch[1].toUpperCase();
    const upperAcc = solfegeMatch[2];
    const numPart = solfegeMatch[3];

    let baseSemitone: number | undefined = SOLFEGE_MAP[rawName];
    if (baseSemitone === undefined) {
      const normalized = removeDiacritics(rawName);
      baseSemitone = SOLFEGE_MAP[normalized];
    }

    if (baseSemitone !== undefined) {
      let semitone = baseSemitone;
      if (upperAcc === '#' || upperAcc === '♯') semitone = (semitone + 1) % 12;
      else if (upperAcc === 'b' || upperAcc === '♭') semitone = (semitone + 11) % 12;

      let octave: number | undefined;
      let durationBeats = 1;

      if (numPart) {
        const num = Number(numPart);
        if (num >= 4 && num <= 7) {
          octave = num;
        } else if (num >= 2 && num <= 4) {
          durationBeats = num;
        }
      }

      return { type: 'solfege', semitone, octave, durationBeats };
    }
  }

  // 2. Tenta Anglo (ex: C, C#, Db, C5, D2, F#5, Eb)
  const angloMatch = /^([A-G])([#b♯♭]?)([0-9]?)$/i.exec(clean);
  if (angloMatch) {
    const baseLetter = angloMatch[1].toUpperCase();
    const acc = angloMatch[2];
    const numPart = angloMatch[3];

    let semitone = ANGLO_MAP[baseLetter];
    if (semitone !== undefined) {
      if (acc === '#' || acc === '♯') semitone = (semitone + 1) % 12;
      else if (acc === 'b' || acc === '♭') semitone = (semitone + 11) % 12;

      let octave: number | undefined;
      let durationBeats = 1;

      if (numPart) {
        const num = Number(numPart);
        if (num >= 4 && num <= 7) {
          octave = num;
        } else if (num >= 2 && num <= 4) {
          durationBeats = num;
        }
      }

      return { type: 'anglo', semitone, octave, durationBeats };
    }
  }

  return null;
}

/**
 * Encontra a nota da ocarina que melhor atende o semitom e oitava desejados
 */
function findBestOcarinaNote(
  semitone: number,
  octave: number | undefined,
  playableNotes: OcarinaNote[]
): OcarinaNote | null {
  if (playableNotes.length === 0) return null;

  // Se a oitava foi especificada (ex: C5 -> MIDI 72)
  if (octave !== undefined) {
    const targetMidi = (octave + 1) * 12 + semitone;
    const exact = playableNotes.find((n) => n.midi === targetMidi);
    if (exact) return exact;
  }

  // Caso padrão: seleciona a nota com o semitone dentro do alcance central da ocarina (priorizando C5-B5, depois A4-B4 ou C6-F6)
  const candidates = playableNotes.filter((n) => ((n.midi % 12) + 12) % 12 === semitone);
  if (candidates.length === 0) return null;

  if (candidates.length === 1) return candidates[0];

  // Se houver mais de uma (ex: C5 e C6), preferir a oitava intermediária natural (72..83)
  const central = candidates.find((n) => n.midi >= 72 && n.midi <= 83);
  return central || candidates[0];
}
