import { describe, it, expect } from 'vitest';
import {
  getNotesForKey,
  HOLE_MAP,
  midiToFrequency,
  DURATION_OPTIONS,
  SAMPLE_SONGS,
  EXTRA_KEYS,
} from '../constants/ocarinaData';
import {
  parseUrlParams,
  serializeUrlParams,
  toggleSectionLigature,
  parseTabForPlayback,
  parseTabTokens,
  updateNoteDurationInTab,
  deleteNoteFromTab,
  updateNotePitchInTab,
  formatDurationLabel,
} from '../utils/ocarinaParser';

describe('Ocarina Musical Mappings & Frequencies', () => {
  it('calculates correct frequencies for Key C', () => {
    const { naturals, accidentals, byKey } = getNotesForKey('C');

    expect(naturals.length).toBe(13); // A4 to F6
    expect(accidentals.length).toBe(8); // A#4, C#5, D#5, F#5, G#5, A#5, C#6, D#6

    // Note A4 (key 'A') has 440 Hz
    expect(byKey['A'].frequency).toBeCloseTo(440, 0);
    expect(byKey['A'].midi).toBe(69);

    // Note C5 (key 'D') has ~523.25 Hz
    expect(byKey['D'].frequency).toBeCloseTo(523.25, 0);

    // Note F6 (key 'U', all open) has ~1396.91 Hz
    expect(byKey['U'].frequency).toBeCloseTo(1396.91, 0);
    expect(byKey['U'].holes.length).toBe(0); // All 12 holes open
  });

  it('correctly maps 12-hole fingerings (HOLE_MAP)', () => {
    // Note 'A' has all 12 holes covered
    expect(HOLE_MAP['A']).toHaveLength(12);
    expect(HOLE_MAP['A']).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    // Note 'D' has all 10 main holes covered (sub-holes open)
    expect(HOLE_MAP['D']).toHaveLength(10);
    expect(HOLE_MAP['D']).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    // Note 'U' has 0 holes covered (open high note)
    expect(HOLE_MAP['U']).toHaveLength(0);
  });

  it('supports Key F and Key G transpositions', () => {
    const notesF = getNotesForKey('F');
    const notesG = getNotesForKey('G');

    // Lowest note on F ocarina is D (key 'A')
    expect(notesF.byKey['A'].label).toBe('D');
    expect(notesF.byKey['A'].midi).toBe(74);

    // Lowest note on G ocarina is E (key 'A')
    expect(notesG.byKey['A'].label).toBe('E');
    expect(notesG.byKey['A'].midi).toBe(76);
  });
});

describe('Rhythm & Timing Controls', () => {
  it('defines all 5 standard note durations with beats', () => {
    expect(DURATION_OPTIONS).toHaveLength(5);
    const whole = DURATION_OPTIONS.find((d) => d.id === 'whole');
    const quarter = DURATION_OPTIONS.find((d) => d.id === 'quarter');
    const eighth = DURATION_OPTIONS.find((d) => d.id === 'eighth');

    expect(whole?.beats).toBe(4);
    expect(quarter?.beats).toBe(1);
    expect(eighth?.beats).toBe(0.5);
  });

  it('correctly parses tab text into rhythmic playback items', () => {
    // 'D - - -' should be 4 beats (note + 3 sustain dashes)
    const items = parseTabForPlayback('D - - -', 'C');
    expect(items).toHaveLength(1);
    expect(items[0].char).toBe('D');
    expect(items[0].durationBeats).toBe(4);
    expect(items[0].note?.label).toBe('C');
  });

  it('handles rests and spaces in playback items', () => {
    const items = parseTabForPlayback('D r F', 'C');
    expect(items).toHaveLength(3);
    expect(items[0].char).toBe('D');
    expect(items[1].isRest).toBe(true);
    expect(items[2].char).toBe('F');
  });
});

describe('URL Sharing & State Serialization', () => {
  it('serializes and deserializes tab parameters', () => {
    const original = {
      name: "Zelda's Lullaby",
      tabs: 'H - P - K - - -',
      key: 'C' as const,
      font: '1' as const,
      size: 54,
      unit: 'px' as const,
      bpm: 110,
    };

    const query = serializeUrlParams(original);
    const parsed = parseUrlParams(`?${query}`);

    expect(parsed.name).toBe(original.name);
    expect(parsed.tabs).toBe(original.tabs);
    expect(parsed.key).toBe(original.key);
    expect(parsed.font).toBe(original.font);
    expect(parsed.size).toBe(original.size);
    expect(parsed.unit).toBe(original.unit);
    expect(parsed.bpm).toBe(original.bpm);
  });
});

describe('Section Slur / Ligature Formatting', () => {
  it('toggles musical tie slur marks on selected notes', () => {
    const singleNote = 'D';
    const tied = toggleSectionLigature(singleNote);
    // Should add combining left paren mark \u0311
    expect(tied).toContain('\u0311');

    // Toggling again should remove it
    const unTied = toggleSectionLigature(tied);
    expect(unTied).toBe(singleNote);
  });
});

describe('Sample Songs Library', () => {
  it('contains Zelda classics with valid ocarina tab notation', () => {
    expect(SAMPLE_SONGS.length).toBeGreaterThanOrEqual(4);
    const zeldasLullaby = SAMPLE_SONGS.find((s) => s.id === 'zeldas-lullaby');
    expect(zeldasLullaby).toBeDefined();
    expect(zeldasLullaby?.tabs).toContain('H - P - K');
  });
});

describe('Individual Note Duration & Timeline Manipulation', () => {
  it('correctly tokenizes tab text into editable note tokens with beats', () => {
    const tab = 'H - P - K - - -';
    const tokens = parseTabTokens(tab, 'C');

    expect(tokens).toHaveLength(3);

    // Note H has 1 dash -> 2 beats
    expect(tokens[0].char).toBe('H');
    expect(tokens[0].beats).toBe(2);
    expect(tokens[0].note?.label).toBe('E');

    // Note P has 1 dash -> 2 beats
    expect(tokens[1].char).toBe('P');
    expect(tokens[1].beats).toBe(2);

    // Note K has 3 dashes -> 4 beats
    expect(tokens[2].char).toBe('K');
    expect(tokens[2].beats).toBe(4);
  });

  it('updates duration of a specific note independently', () => {
    const tab = 'H - P - K - - -';
    const tokens = parseTabTokens(tab, 'C');

    // Change note H (token 0) to 4 beats
    const updated1 = updateNoteDurationInTab(tab, tokens[0], 4);
    expect(updated1).toBe('H - - - P - K - - -');

    // Re-parse and change note K (token 2) to 1 beat (no dashes)
    const tokensUpdated = parseTabTokens(updated1, 'C');
    const updated2 = updateNoteDurationInTab(updated1, tokensUpdated[2], 1);
    expect(updated2).toBe('H - - - P - K');
  });

  it('deletes a specific note without breaking tab structure', () => {
    const tab = 'D F H P';
    const tokens = parseTabTokens(tab, 'C');

    // Delete note F (index 1)
    const afterDelete = deleteNoteFromTab(tab, tokens[1]);
    expect(afterDelete).toBe('D H P');
  });

  it('changes pitch of a specific note in the tab', () => {
    const tab = 'D - F -';
    const tokens = parseTabTokens(tab, 'C');

    const updated = updateNotePitchInTab(tab, tokens[0], 'H');
    expect(updated).toBe('H - F -');
  });

  it('formats musical duration symbols and Portuguese labels accurately', () => {
    expect(formatDurationLabel(4).symbol).toBe('𝅝');
    expect(formatDurationLabel(4).namePt).toContain('Semibreve');

    expect(formatDurationLabel(2).symbol).toBe('𝅗𝅥');
    expect(formatDurationLabel(2).namePt).toContain('Mínima');

    expect(formatDurationLabel(1).symbol).toBe('♩');
    expect(formatDurationLabel(1).namePt).toContain('Semínima');

    expect(formatDurationLabel(0.5).symbol).toBe('♪');
    expect(formatDurationLabel(0.5).namePt).toContain('Colcheia');
  });
});

