import { parseTabTokens } from './ocarinaParser';
import type { OcarinaKey } from '../types/ocarina';

export interface WavExportOptions {
  title: string;
  tabText: string;
  ocarinaKey: OcarinaKey;
  bpm: number;
  filename?: string;
}

/**
 * Converte um AudioBuffer para bytes em formato WAV (PCM 16-bit mono)
 */
function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const channelData = buffer.getChannelData(0);
  const dataSize = channelData.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Uint8Array(arrayBuffer);
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Renderiza a melodia em um AudioBuffer usando OfflineAudioContext
 */
export async function renderOcarinaToAudioBuffer({
  tabText,
  ocarinaKey,
  bpm,
}: {
  tabText: string;
  ocarinaKey: OcarinaKey;
  bpm: number;
}): Promise<AudioBuffer> {
  const tokens = parseTabTokens(tabText, ocarinaKey);
  const secondsPerBeat = 60 / Math.max(30, Math.min(300, bpm || 120));

  // Calcula duração total
  let totalDurationSec = 0;
  for (const token of tokens) {
    totalDurationSec += token.beats * secondsPerBeat;
  }
  totalDurationSec = Math.max(1, totalDurationSec + 0.8); // +0.8s para release e cauda acústica

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * totalDurationSec), sampleRate);

  let currentTime = 0.05;

  for (const token of tokens) {
    const durationSec = token.beats * secondsPerBeat;

    if (!token.isRest && token.note && token.note.frequency > 0) {
      const freq = token.note.frequency;
      const attackTime = 0.035;
      const releaseTime = 0.07;
      const notePlayTime = Math.max(0.08, durationSec * 0.95);
      const sustainTime = Math.max(0.02, notePlayTime - attackTime - releaseTime);

      const masterGain = offlineCtx.createGain();
      masterGain.gain.setValueAtTime(0.0001, currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, currentTime + attackTime);
      masterGain.gain.setValueAtTime(0.35, currentTime + attackTime + sustainTime);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, currentTime + notePlayTime);
      masterGain.connect(offlineCtx.destination);

      // Oscilador 1: Fundamental
      const osc1 = offlineCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, currentTime);

      // Vibrato acústico sutil
      const vibrato = offlineCtx.createOscillator();
      vibrato.frequency.setValueAtTime(5.2, currentTime);
      const vibratoGain = offlineCtx.createGain();
      vibratoGain.gain.setValueAtTime(0, currentTime);
      vibratoGain.gain.linearRampToValueAtTime(freq * 0.012, currentTime + 0.15);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);

      // Oscilador 2: 2º harmônico
      const osc2 = offlineCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, currentTime);
      const gain2 = offlineCtx.createGain();
      gain2.gain.setValueAtTime(0.06, currentTime);

      // Oscilador 3: 3º harmônico
      const osc3 = offlineCtx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 3, currentTime);
      const gain3 = offlineCtx.createGain();
      gain3.gain.setValueAtTime(0.018, currentTime);

      osc1.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc3.connect(gain3);
      gain3.connect(masterGain);

      vibrato.start(currentTime);
      osc1.start(currentTime);
      osc2.start(currentTime);
      osc3.start(currentTime);

      vibrato.stop(currentTime + notePlayTime + 0.05);
      osc1.stop(currentTime + notePlayTime + 0.05);
      osc2.stop(currentTime + notePlayTime + 0.05);
      osc3.stop(currentTime + notePlayTime + 0.05);
    }

    currentTime += durationSec;
  }

  return offlineCtx.startRendering();
}

/**
 * Exporta a tablatura atual renderizada em arquivo WAV e dispara o download
 */
export async function exportTabAsWav({
  title,
  tabText,
  ocarinaKey,
  bpm,
  filename,
}: WavExportOptions): Promise<void> {
  const audioBuffer = await renderOcarinaToAudioBuffer({ tabText, ocarinaKey, bpm });
  const wavBytes = audioBufferToWav(audioBuffer);
  const blob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
  const finalFilename =
    filename || `${(title || 'ocarina_melody').toLowerCase().replace(/\s+/g, '_')}.wav`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
