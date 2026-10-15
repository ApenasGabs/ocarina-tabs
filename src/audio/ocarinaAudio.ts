/**
 * Motor de Áudio Web Audio API para Ocarina
 * Emulação acústica de ocarina (flauta globular de cerâmica):
 * - Onda fundamental senoidal pura e quente
 * - Harmônicos sutis (2º e 3º harmônico)
 * - Ruído de sopro/ar filtrado
 * - Vibrato acústico natural (LFO ~5.2Hz com fade-in)
 * - Envelope ADSR suave sem cliques
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;
let globalVolume = 0.8;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(muted: boolean): void {
  isMuted = muted;
}

export function getMuted(): boolean {
  return isMuted;
}

export function setVolume(vol: number): void {
  globalVolume = Math.max(0, Math.min(1, vol));
}

export function getVolume(): number {
  return globalVolume;
}

// Cria um buffer de ruído de sopro suave
function createBreathNoiseBuffer(ctx: AudioContext, duration = 1.0): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = lastOut * 0.95 + white * 0.05;
    data[i] = lastOut;
  }
  return buffer;
}

/**
 * Toca uma nota de ocarina com frequência e duração especificadas
 */
export function playOcarinaFrequency(
  frequency: number,
  durationSeconds = 0.6,
  options?: { volumeScale?: number; onEnded?: () => void }
): { stop: () => void } {
  if (isMuted || frequency <= 0) {
    if (options?.onEnded) {
      setTimeout(options.onEnded, durationSeconds * 1000);
    }
    return { stop: () => {} };
  }

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const volScale = (options?.volumeScale ?? 1) * globalVolume;

    // Master gain para a nota
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    const attackTime = 0.035;
    const releaseTime = 0.07;
    const sustainTime = Math.max(0.05, durationSeconds - attackTime - releaseTime);

    masterGain.gain.linearRampToValueAtTime(0.35 * volScale, now + attackTime);
    masterGain.gain.setValueAtTime(0.35 * volScale, now + attackTime + sustainTime);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    // Filtro passa-baixa para aquecer o som e simular o corpo oco da ocarina
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3.5, now);
    filter.Q.setValueAtTime(1.2, now);

    // Oscilador 1: Fundamental (senoidal)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);

    // Oscilador 2: 2º harmônico (1 oitava acima, mais sutil)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.12, now);
    osc2.connect(osc2Gain);

    // Oscilador 3: 3º harmônico bem suave
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 3, now);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.03, now);
    osc3.connect(osc3Gain);

    // Vibrato acústico natural via LFO
    const vibratoLFO = ctx.createOscillator();
    vibratoLFO.frequency.setValueAtTime(5.2, now);
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.setValueAtTime(0.0001, now);
    vibratoGain.gain.linearRampToValueAtTime(frequency * 0.015, now + 0.15);
    vibratoLFO.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);

    // Ruído de ar do sopro
    const breathBuffer = createBreathNoiseBuffer(ctx, Math.min(2, durationSeconds + 0.2));
    const breathSource = ctx.createBufferSource();
    breathSource.buffer = breathBuffer;
    const breathFilter = ctx.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(frequency * 1.5, now);
    breathFilter.Q.setValueAtTime(2.0, now);
    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0.018 * volScale, now);
    breathSource.connect(breathFilter);
    breathFilter.connect(breathGain);

    // Conexões
    osc1.connect(filter);
    osc2Gain.connect(filter);
    osc3Gain.connect(filter);
    breathGain.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Início
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    vibratoLFO.start(now);
    breathSource.start(now);

    // Parada
    const stopTime = now + durationSeconds + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
    vibratoLFO.stop(stopTime);
    breathSource.stop(stopTime);

    const timer = setTimeout(() => {
      options?.onEnded?.();
    }, durationSeconds * 1000);

    return {
      stop: () => {
        clearTimeout(timer);
        try {
          const fadeOut = ctx.currentTime;
          masterGain.gain.cancelScheduledValues(fadeOut);
          masterGain.gain.linearRampToValueAtTime(0.0001, fadeOut + 0.04);
          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
              osc3.stop();
              vibratoLFO.stop();
              breathSource.stop();
            } catch {
              // Já parou
            }
          }, 50);
        } catch {
          // Ignora
        }
      },
    };
  } catch (err) {
    console.warn('Erro ao reproduzir áudio da ocarina:', err);
    if (options?.onEnded) {
      setTimeout(options.onEnded, durationSeconds * 1000);
    }
    return { stop: () => {} };
  }
}

/**
 * Toca clique sutil de metrônomo para marcação de tempo
 */
export function playMetronomeClick(isHigh = false): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, now);

    gain.gain.setValueAtTime(0.15 * globalVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Ignora
  }
}
