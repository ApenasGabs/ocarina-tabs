import { describe, it, expect } from 'vitest';
import {
  exportToAbc,
  parseAbc,
  isAbcNotation,
  midiToAbcPitch,
} from '../utils/abcConverter';
import {
  isNoteText,
  parseNoteText,
} from '../utils/noteTextConverter';
import {
  createSongPackage,
  validateSongPackage,
  createLibraryBackup,
  validateLibraryBackup,
} from '../utils/songPackage';
import { generateMidiFile } from '../utils/midiExport';

describe('ABC Notation Converter', () => {
  it('converts MIDI note numbers to standard ABC pitch syntax', () => {
    expect(midiToAbcPitch(69)).toBe('A'); // A4
    expect(midiToAbcPitch(71)).toBe('B'); // B4
    expect(midiToAbcPitch(72)).toBe('c'); // C5
    expect(midiToAbcPitch(74)).toBe('d'); // D5
    expect(midiToAbcPitch(76)).toBe('e'); // E5
    expect(midiToAbcPitch(77)).toBe('f'); // F5
    expect(midiToAbcPitch(78)).toBe('^f'); // F#5
    expect(midiToAbcPitch(84)).toBe("c'"); // C6
    expect(midiToAbcPitch(89)).toBe("f'"); // F6
  });

  it('exports ocarina tab to standard ABC format with valid headers', () => {
    const tabText = 'H - P - K - - -\nI - H - F - - -';
    const abc = exportToAbc({
      title: "Zelda's Lullaby",
      tabText,
      ocarinaKey: 'C',
      bpm: 100,
      meter: '4/4',
    });

    expect(abc).toContain('X: 1');
    expect(abc).toContain("T: Zelda's Lullaby");
    expect(abc).toContain('M: 4/4');
    expect(abc).toContain('Q: 1/4=100');
    expect(abc).toContain('K: C');
    // H is E5 (e), P is C6 (c'), K is G5 (g)
    expect(abc).toContain("e2 c'2 g4");
  });

  it('detects ABC notation strings correctly', () => {
    const validAbc = `
      X: 1
      T: Saria's Song
      M: 4/4
      K: C
      F A B F A B
    `;
    expect(isAbcNotation(validAbc)).toBe(true);

    const normalOcarinaTab = 'H - P - K - - -';
    expect(isAbcNotation(normalOcarinaTab)).toBe(false);

    const pureText = 'Apenas uma anotação qualquer';
    expect(isAbcNotation(pureText)).toBe(false);
  });

  it('parses ABC notation into playable ocarina tab with metadata', () => {
    const abc = `
      X: 1
      T: Song of Storms
      M: 4/4
      L: 1/4
      Q: 135
      K: C
      d f d'4
    `;
    const result = parseAbc(abc, 'C');

    expect(result.title).toBe('Song of Storms');
    expect(result.bpm).toBe(135);
    expect(result.ocarinaKey).toBe('C');
    expect(result.notesCount).toBe(3);
    // In key C: d is D5 (glyph F), f is F5 (glyph I), d' is D6 (glyph R)
    expect(result.tabText).toContain('F');
    expect(result.tabText).toContain('I');
    expect(result.tabText).toContain('R - - -');
  });

  it('handles rests and bar lines in ABC', () => {
    const abc = `
      X: 1
      T: Test Song
      K: C
      c z2 e | g4
    `;
    const result = parseAbc(abc, 'C');
    expect(result.tabText).toContain('r -');
    expect(result.tabText).toContain('|');
  });

  it('automatically adapts octaves if melody is outside standard ocarina register', () => {
    // C4..B4 is generally lower than the 12-hole ocarina sweet spot (A4-F6)
    const lowAbc = `
      X: 1
      T: Low Melody
      K: C
      C D E F G A B
    `;
    const result = parseAbc(lowAbc, 'C');
    expect(result.notesCount).toBe(7);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Note Names / Cifras Converter', () => {
  it('detects Anglo-Saxon note names', () => {
    expect(isNoteText('C D E G A B')).toBe(true);
    expect(isNoteText('C# D# F# G# A#')).toBe(true);
    expect(isNoteText('C D E - G - - C2 D2')).toBe(true);
  });

  it('detects Latin Solfege note names with and without accents', () => {
    expect(isNoteText('Dó Ré Mi Sol Lá Si')).toBe(true);
    expect(isNoteText('Do Re Mi Fa Sol La Si')).toBe(true);
    expect(isNoteText('Dó# Ré# Fá# Sol#')).toBe(true);
  });

  it('does not confuse ocarina tab glyphs with note text', () => {
    // In ocarina font, H, K, P, T, U are fingerings, not standard notes
    expect(isNoteText('H - P - K - - -')).toBe(false);
    expect(isNoteText('I K M O T U')).toBe(false);
  });

  it('converts Anglo note text to ocarina tablature', () => {
    const text = 'C D E G | C2 D2';
    const result = parseNoteText(text, 'C');

    expect(result.detectedNotation).toBe('anglo');
    expect(result.notesCount).toBe(6);
    // In key C: C is D, D is F, E is H, G is K
    expect(result.tabText).toContain('D');
    expect(result.tabText).toContain('F');
    expect(result.tabText).toContain('H');
    expect(result.tabText).toContain('K');
    expect(result.tabText).toContain('|');
    expect(result.tabText).toContain('D -');
  });

  it('converts Solfege note text with accents and sustains', () => {
    const text = 'Dó Ré Mi - Sol - -';
    const result = parseNoteText(text, 'C');

    expect(result.detectedNotation).toBe('solfege');
    expect(result.notesCount).toBe(4);
    // Dó is C (glyph D), Ré is D (glyph F), Mi is E (glyph H), Sol is G (glyph K)
    expect(result.tabText).toContain('D');
    expect(result.tabText).toContain('F');
    expect(result.tabText).toContain('H');
    expect(result.tabText).toContain('K');
  });
});

describe('Song Package (.otab) & Library Backup', () => {
  it('creates and validates a valid single song package (.otab)', () => {
    const pkg = createSongPackage({
      title: "Zelda's Lullaby",
      artist: 'Koji Kondo',
      key: 'C',
      bpm: 100,
      font: '1',
      fontSize: 54,
      fontSizeUnit: 'px',
      tabs: 'H - P - K',
    });

    expect(pkg.type).toBe('ocarina-song');
    expect(pkg.metadata.title).toBe("Zelda's Lullaby");
    expect(pkg.content.tabs).toBe('H - P - K');

    const validated = validateSongPackage(pkg);
    expect(validated).not.toBeNull();
    expect(validated?.metadata.bpm).toBe(100);
  });

  it('rejects invalid song package schemas gracefully', () => {
    expect(validateSongPackage(null)).toBeNull();
    expect(validateSongPackage({})).toBeNull();
    expect(validateSongPackage({ type: 'other' })).toBeNull();
    expect(validateSongPackage({ type: 'ocarina-song', metadata: {} })).toBeNull();
  });

  it('creates and validates library backups', () => {
    const songs = [
      {
        title: 'Song 1',
        key: 'C' as const,
        bpm: 120,
        font: '1' as const,
        fontSize: 50,
        fontSizeUnit: 'px' as const,
        tabs: 'D F H',
      },
      {
        title: 'Song 2',
        key: 'G' as const,
        bpm: 140,
        font: '2' as const,
        fontSize: 48,
        fontSizeUnit: 'px' as const,
        tabs: 'A B D',
      },
    ];

    const backup = createLibraryBackup(songs);
    expect(backup.type).toBe('ocarina-library-backup');
    expect(backup.songs.length).toBe(2);

    const validated = validateLibraryBackup(backup);
    expect(validated).not.toBeNull();
    expect(validated?.songs.length).toBe(2);
    expect(validated?.songs[0].metadata.title).toBe('Song 1');
    expect(validated?.songs[1].metadata.title).toBe('Song 2');
  });
});

describe('MIDI Generation', () => {
  it('generates a valid SMF Type 0 binary with Ocarina instrument (GM 79)', () => {
    const midiBytes = generateMidiFile({
      title: 'Test Melody',
      tabText: 'D - F - H - - -',
      ocarinaKey: 'C',
      bpm: 120,
    });

    expect(midiBytes).toBeInstanceOf(Uint8Array);
    expect(midiBytes.length).toBeGreaterThan(30);

    // SMF Header Magic Bytes: 'MThd' (0x4D, 0x54, 0x68, 0x64)
    expect(midiBytes[0]).toBe(0x4d);
    expect(midiBytes[1]).toBe(0x54);
    expect(midiBytes[2]).toBe(0x68);
    expect(midiBytes[3]).toBe(0x64);

    // Contains Track chunk 'MTrk' (0x4D, 0x54, 0x72, 0x6B)
    const str = String.fromCharCode(...midiBytes);
    expect(str).toContain('MTrk');
  });
});
