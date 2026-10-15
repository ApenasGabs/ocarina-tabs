import { parseTabTokens } from './ocarinaParser';
import type { OcarinaKey } from '../types/ocarina';

export interface MidiExportOptions {
  title: string;
  tabText: string;
  ocarinaKey: OcarinaKey;
  bpm: number;
  filename?: string;
}

/**
 * Codifica um número inteiro em formato Variable Length Quantity (VLQ) padrão MIDI
 */
function encodeVLQ(value: number): number[] {
  const bytes: number[] = [];
  let v = Math.max(0, Math.round(value));
  bytes.push(v & 0x7f);
  v >>= 7;

  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

/**
 * Converte string para array de bytes ASCII
 */
function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

/**
 * Gera um arquivo Standard MIDI File (SMF Tipo 0) em ArrayBuffer
 */
export function generateMidiFile({
  title,
  tabText,
  ocarinaKey,
  bpm,
}: {
  title: string;
  tabText: string;
  ocarinaKey: OcarinaKey;
  bpm: number;
}): Uint8Array {
  const ticksPerBeat = 480;
  const trackData: number[] = [];

  // 1. Meta Event: Nome da Faixa / Título
  const titleBytes = stringToBytes(title || 'Ocarina Tab');
  trackData.push(0x00); // delta 0
  trackData.push(0xff, 0x03, ...encodeVLQ(titleBytes.length), ...titleBytes);

  // 2. Meta Event: Set Tempo (Microssegundos por semínima)
  const safeBpm = Math.max(30, Math.min(300, bpm || 120));
  const mpqn = Math.round(60000000 / safeBpm);
  trackData.push(0x00); // delta 0
  trackData.push(
    0xff,
    0x51,
    0x03,
    (mpqn >> 16) & 0xff,
    (mpqn >> 8) & 0xff,
    mpqn & 0xff
  );

  // 3. Meta Event: Time Signature (4/4)
  trackData.push(0x00); // delta 0
  trackData.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // 4. Program Change: GM Instrument 79 (Ocarina) no Canal 0
  trackData.push(0x00); // delta 0
  trackData.push(0xc0, 79);

  // 5. Gera eventos de notas
  const tokens = parseTabTokens(tabText, ocarinaKey);
  let pendingDelta = 0;

  for (const token of tokens) {
    const durationTicks = Math.round(token.beats * ticksPerBeat);

    if (token.isRest || !token.note) {
      pendingDelta += durationTicks;
      continue;
    }

    const midiNote = Math.max(0, Math.min(127, token.note.midi));
    const velocity = 96;

    // Note On
    trackData.push(...encodeVLQ(pendingDelta));
    trackData.push(0x90, midiNote, velocity);

    // Note Off após a duração
    trackData.push(...encodeVLQ(durationTicks));
    trackData.push(0x80, midiNote, 0);

    pendingDelta = 0;
  }

  // 6. Meta Event: End of Track
  trackData.push(...encodeVLQ(pendingDelta));
  trackData.push(0xff, 0x2f, 0x00);

  // Monta o arquivo SMF completo (Header + Track)
  const headerData = [
    // 'MThd'
    0x4d, 0x54, 0x68, 0x64,
    // Header length: 6
    0x00, 0x00, 0x00, 0x06,
    // Format: 0 (single track)
    0x00, 0x00,
    // Number of tracks: 1
    0x00, 0x01,
    // Division: 480 ticks/beat
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff,
  ];

  const trackHeader = [
    // 'MTrk'
    0x4d, 0x54, 0x72, 0x6b,
    // Track length (4 bytes)
    (trackData.length >> 24) & 0xff,
    (trackData.length >> 16) & 0xff,
    (trackData.length >> 8) & 0xff,
    trackData.length & 0xff,
  ];

  const fullFile = new Uint8Array(headerData.length + trackHeader.length + trackData.length);
  fullFile.set(headerData, 0);
  fullFile.set(trackHeader, headerData.length);
  fullFile.set(trackData, headerData.length + trackHeader.length);

  return fullFile;
}

/**
 * Dispara o download de um arquivo MIDI (.mid) no navegador
 */
export function exportTabAsMidi({
  title,
  tabText,
  ocarinaKey,
  bpm,
  filename,
}: MidiExportOptions): void {
  const midiBytes = generateMidiFile({ title, tabText, ocarinaKey, bpm });
  const blob = new Blob([midiBytes.buffer as ArrayBuffer], { type: 'audio/midi' });
  const finalFilename =
    filename || `${(title || 'ocarina_melody').toLowerCase().replace(/\s+/g, '_')}.mid`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
