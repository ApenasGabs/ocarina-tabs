import { describe, it, expect } from 'vitest';
import { getNotesForKey, HOLE_MAP, midiToFrequency, SAMPLE_SONGS } from '../constants/ocarinaData';
import {
  parseUrlParams,
  serializeUrlParams,
  addSectionLigature,
  removeSectionLigature,
  toggleSectionLigature,
  parseTabForPlayback,
} from '../utils/ocarinaParser';

describe('Ocarina Constants & Data', () => {
  it('deve calcular frequências MIDI corretamente (A4 = 440 Hz, C5 = 523.25 Hz)', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(72)).toBe(523.25);
    expect(midiToFrequency(81)).toBe(880);
  });

  it('deve mapear corretamente notas para o Tom C', () => {
    const { naturals, accidentals, byKey } = getNotesForKey('C');
    expect(naturals.length).toBe(13);
    expect(accidentals.length).toBe(8);

    // Dó (D) deve ter 10 furos principais cobertos (furos 1 a 10)
    const noteD = byKey['D'];
    expect(noteD).toBeDefined();
    expect(noteD.label).toBe('C');
    expect(noteD.holes).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    // Fá agudo (U) tem 0 furos fechados
    const noteU = byKey['U'];
    expect(noteU).toBeDefined();
    expect(noteU.label).toBe('F²');
    expect(noteU.holes).toEqual([]);
  });

  it('deve conter canções de exemplo válidas', () => {
    expect(SAMPLE_SONGS.length).toBeGreaterThanOrEqual(4);
    const zeldasLullaby = SAMPLE_SONGS.find((s) => s.id === 'zeldas-lullaby');
    expect(zeldasLullaby).toBeDefined();
    expect(zeldasLullaby?.tabs).toContain('H - P - K');
  });

  it('deve ter furos definidos para todas as notas básicas', () => {
    for (const key of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U']) {
      expect(HOLE_MAP[key]).toBeDefined();
    }
  });
});

describe('Ocarina Parser & Utilities', () => {
  it('deve serializar e deserializar parâmetros de URL perfeitamente', () => {
    const params = {
      name: 'Test Song',
      tabs: 'D - F - H\nP - O',
      key: 'C' as const,
      font: '1' as const,
      size: 60,
      unit: 'px' as const,
      bpm: 125,
      readonly: false,
    };

    const serialized = serializeUrlParams(params);
    expect(serialized).toContain('tabs=D+-+F+-+H/P+-+O');

    const parsed = parseUrlParams(`?${serialized}`);
    expect(parsed.name).toBe('Test Song');
    expect(parsed.tabs).toBe('D - F - H\nP - O');
    expect(parsed.key).toBe('C');
    expect(parsed.font).toBe('1');
    expect(parsed.size).toBe(60);
    expect(parsed.bpm).toBe(125);
  });

  it('deve adicionar e remover ligaduras (slurs) musicais', () => {
    const original = 'DFHP';
    const withLigature = addSectionLigature(original);
    expect(withLigature).not.toBe(original);
    // Remove ligadura deve voltar ao original
    const restored = removeSectionLigature(withLigature);
    expect(restored).toBe(original);

    // Toggle deve alternar
    const toggled = toggleSectionLigature(original);
    expect(toggled).toBe(withLigature);
    expect(toggleSectionLigature(toggled)).toBe(original);
  });

  it('deve analisar tablatura para playback sequencial com tempos e pausas', () => {
    const tabText = 'D - - F r - H';
    const items = parseTabForPlayback(tabText, 'C');

    expect(items.length).toBe(4);

    // D com duas sustentações (- -) = 1 + 2 = 3 tempos
    expect(items[0].char).toBe('D');
    expect(items[0].durationBeats).toBe(3);
    expect(items[0].isRest).toBe(false);

    // F sem sustentação = 1 tempo
    expect(items[1].char).toBe('F');
    expect(items[1].durationBeats).toBe(1);

    // r (pausa) com uma sustentação (-) = 1 + 1 = 2 tempos
    expect(items[2].char).toBe('r');
    expect(items[2].isRest).toBe(true);
    expect(items[2].durationBeats).toBe(2);

    // H = 1 tempo
    expect(items[3].char).toBe('H');
    expect(items[3].durationBeats).toBe(1);
  });
});
