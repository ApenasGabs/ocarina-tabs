import { getNotesForKey } from '../constants/ocarinaData';
import type { FontVariant, FontSizeUnit, OcarinaKey, TabPlaybackItem } from '../types/ocarina';

export interface TabUrlParams {
  tabs?: string;
  name?: string;
  size?: number;
  unit?: FontSizeUnit;
  font?: FontVariant;
  key?: OcarinaKey;
  bpm?: number;
  readonly?: boolean;
}

export function parseUrlParams(search: string): TabUrlParams {
  const clean = search.replace(/^\?/, '');
  const result: TabUrlParams = {};
  if (!clean) return result;

  const pairs = clean.replace(/\+/g, ' ').replace(/\//g, '\n').split('&');
  for (const rawPair of pairs) {
    const [rawKey, ...valParts] = rawPair.split('=');
    const key = decodeURIComponent(rawKey || '');
    const val = decodeURIComponent(valParts.join('='));

    if (key === 'tabs') result.tabs = val;
    else if (key === 'name') result.name = val;
    else if (key === 'font' && (val === '1' || val === '2')) result.font = val;
    else if (key === 'key' && (val === 'C' || val === 'F' || val === 'G')) result.key = val;
    else if (key === 'bpm') result.bpm = Number(val) || 120;
    else if (key === 'readonly') result.readonly = val === 'true';
    else if (key === 'size') {
      const match = /^\s*(\d+(?:\.\d*)?)(\w+)?\s*$/.exec(val);
      if (match) {
        result.size = Number(match[1]);
        if (match[2]) result.unit = match[2] as FontSizeUnit;
      }
    }
  }

  return result;
}

export function serializeUrlParams(params: TabUrlParams): string {
  const query = new URLSearchParams();
  if (params.tabs) query.set('tabs', params.tabs);
  if (params.name) query.set('name', params.name);
  if (params.key) query.set('key', params.key);
  if (params.font) query.set('font', params.font);
  if (params.size && params.unit) query.set('size', `${params.size}${params.unit}`);
  if (params.bpm) query.set('bpm', String(params.bpm));
  if (params.readonly) query.set('readonly', 'true');

  return query.toString().replace(/%20/g, '+').replace(/%0A/gi, '/');
}

export const SECTION_CHARS = {
  OVERLINE: '\u0305',
  BOTTOM_LEFT_PAREN: '\u1DC7',
  TOP_LEFT_PAREN: '\u1DC6',
  LEFT_PAREN: '\u0311',
};

export function isCombining(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f)
  );
}

export function removeSectionLigature(text: string): string {
  return text.replace(/[\u0305\u1DC7\u1DC6\u0311]/g, '');
}

export function addSectionLigature(text: string): string {
  const clean = removeSectionLigature(text);
  return clean.replace(/[A-Za-z0-9]+/g, (slice) => {
    if (slice.length === 1) {
      return slice + SECTION_CHARS.LEFT_PAREN;
    } else {
      const first = slice.charAt(0);
      const last = slice.charAt(slice.length - 1);
      const middle = slice
        .slice(1, slice.length - 1)
        .replace(/(.)/g, `$1${SECTION_CHARS.OVERLINE}`);
      return `${first}${SECTION_CHARS.BOTTOM_LEFT_PAREN}${middle}${last}${SECTION_CHARS.TOP_LEFT_PAREN}`;
    }
  });
}

export function toggleSectionLigature(text: string): string {
  let hasLigature = false;
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (
      char === SECTION_CHARS.OVERLINE ||
      char === SECTION_CHARS.BOTTOM_LEFT_PAREN ||
      char === SECTION_CHARS.TOP_LEFT_PAREN ||
      char === SECTION_CHARS.LEFT_PAREN
    ) {
      hasLigature = true;
      break;
    }
  }
  return hasLigature ? removeSectionLigature(text) : addSectionLigature(text);
}

export function parseTabForPlayback(tabText: string, ocarinaKey: OcarinaKey): TabPlaybackItem[] {
  const { byKey } = getNotesForKey(ocarinaKey);
  const items: TabPlaybackItem[] = [];

  const clean = removeSectionLigature(tabText);
  let currentIndex = 0;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (char === 'r') {
      let beats = 1;
      while (i + 1 < clean.length && (clean[i + 1] === '-' || clean[i + 1] === ' ')) {
        if (clean[i + 1] === '-') beats += 1;
        i++;
      }
      items.push({
        char: 'r',
        isRest: true,
        isSustain: false,
        durationBeats: beats,
        index: currentIndex++,
      });
    } else if (byKey[char]) {
      let beats = 1;
      let checkIdx = i + 1;
      while (checkIdx < clean.length) {
        const nextChar = clean[checkIdx];
        if (nextChar === '-') {
          beats += 1;
          checkIdx++;
        } else if (nextChar === ' ') {
          checkIdx++;
        } else {
          break;
        }
      }
      i = checkIdx - 1;

      items.push({
        char,
        note: byKey[char],
        isRest: false,
        isSustain: false,
        durationBeats: beats,
        index: currentIndex++,
      });
    }
  }

  return items;
}
