import type { DurationOption, ExtraKey, OcarinaKey, OcarinaNote, SampleSong } from '../types/ocarina';

// Mapeamento dos furos fechados para cada caractere na fonte da Ocarina
export const HOLE_MAP: Record<string, number[]> = {
  B: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  E: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
  G: [3, 4, 5, 6, 7, 8, 9, 10, 12],
  J: [2, 5, 6, 7, 8, 9, 10],
  L: [2, 6, 7, 8, 9, 10],
  N: [2, 7, 8, 9, 10],
  Q: [2, 9, 10],
  S: [2, 10],

  A: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  C: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
  D: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  F: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  H: [3, 4, 5, 6, 7, 8, 9, 10],
  I: [4, 5, 6, 7, 8, 9, 10],
  K: [5, 6, 7, 8, 9, 10],
  M: [6, 7, 8, 9, 10],
  O: [7, 8, 9, 10],
  P: [8, 9, 10],
  R: [9, 10],
  T: [10],
  U: [],
};

export function midiToFrequency(midi: number): number {
  return Number((440 * Math.pow(2, (midi - 69) / 12)).toFixed(2));
}

// Definição das notas por tom (C, F, G)
export const KEY_DATA: Record<
  OcarinaKey,
  {
    half: Array<{ key: string; label: string; midi: number }>;
    full: Array<{ key: string; label: string; midi: number }>;
  }
> = {
  C: {
    half: [
      { key: 'B', label: 'A♯', midi: 70 },
      { key: 'E', label: 'C♯', midi: 73 },
      { key: 'G', label: 'D♯', midi: 75 },
      { key: 'J', label: 'F♯', midi: 78 },
      { key: 'L', label: 'G♯', midi: 80 },
      { key: 'N', label: 'A♯²', midi: 82 },
      { key: 'Q', label: 'C♯²', midi: 85 },
      { key: 'S', label: 'D♯²', midi: 87 },
    ],
    full: [
      { key: 'A', label: 'A', midi: 69 },
      { key: 'C', label: 'B', midi: 71 },
      { key: 'D', label: 'C', midi: 72 },
      { key: 'F', label: 'D', midi: 74 },
      { key: 'H', label: 'E', midi: 76 },
      { key: 'I', label: 'F', midi: 77 },
      { key: 'K', label: 'G', midi: 79 },
      { key: 'M', label: 'A²', midi: 81 },
      { key: 'O', label: 'B²', midi: 83 },
      { key: 'P', label: 'C²', midi: 84 },
      { key: 'R', label: 'D²', midi: 86 },
      { key: 'T', label: 'E²', midi: 88 },
      { key: 'U', label: 'F²', midi: 89 },
    ],
  },
  F: {
    half: [
      { key: 'B', label: 'D♯', midi: 75 },
      { key: 'E', label: 'F♯', midi: 78 },
      { key: 'G', label: 'G♯', midi: 80 },
      { key: 'I', label: 'A♯', midi: 82 },
      { key: 'L', label: 'C♯', midi: 85 },
      { key: 'N', label: 'D♯²', midi: 87 },
      { key: 'Q', label: 'F♯²', midi: 90 },
      { key: 'S', label: 'G♯²', midi: 92 },
      { key: 'U', label: 'A♯²', midi: 94 },
    ],
    full: [
      { key: 'A', label: 'D', midi: 74 },
      { key: 'C', label: 'E', midi: 76 },
      { key: 'D', label: 'F', midi: 77 },
      { key: 'F', label: 'G', midi: 79 },
      { key: 'H', label: 'A', midi: 81 },
      { key: 'J', label: 'B', midi: 83 },
      { key: 'K', label: 'C', midi: 84 },
      { key: 'M', label: 'D²', midi: 86 },
      { key: 'O', label: 'E²', midi: 88 },
      { key: 'P', label: 'F²', midi: 89 },
      { key: 'R', label: 'G²', midi: 91 },
      { key: 'T', label: 'A²', midi: 93 },
    ],
  },
  G: {
    half: [
      { key: 'C', label: 'F♯', midi: 78 },
      { key: 'E', label: 'G♯', midi: 80 },
      { key: 'G', label: 'A♯', midi: 82 },
      { key: 'J', label: 'C♯', midi: 85 },
      { key: 'L', label: 'D♯', midi: 87 },
      { key: 'O', label: 'F♯²', midi: 90 },
      { key: 'Q', label: 'G♯²', midi: 92 },
      { key: 'S', label: 'A♯²', midi: 94 },
    ],
    full: [
      { key: 'A', label: 'E', midi: 76 },
      { key: 'B', label: 'F', midi: 77 },
      { key: 'D', label: 'G', midi: 79 },
      { key: 'F', label: 'A', midi: 81 },
      { key: 'H', label: 'B', midi: 83 },
      { key: 'I', label: 'C', midi: 84 },
      { key: 'K', label: 'D', midi: 86 },
      { key: 'M', label: 'E²', midi: 88 },
      { key: 'N', label: 'F²', midi: 89 },
      { key: 'P', label: 'G²', midi: 91 },
      { key: 'R', label: 'A²', midi: 93 },
      { key: 'T', label: 'B²', midi: 95 },
      { key: 'U', label: 'C²', midi: 96 },
    ],
  },
};

export const EXTRA_KEYS: ExtraKey[] = [
  { key: 'q', label: '×2', title: 'Tocar duas vezes (x2)', isModifier: true },
  { key: 'r', label: 'Pausa (Rest)', title: 'Pausa musical (Silêncio)', isRest: true },
  { key: ' ', label: 'Espaço', title: 'Espaço entre notas' },
  { key: '-', label: '– (Sustentar)', title: 'Prolongar duração/tempo da nota anterior' },
  { key: '|', label: '| (Compasso)', title: 'Linha divisória de compasso' },
  { key: 'X', label: '× (Repetir)', title: 'Marcação de repetição' },
  { key: '\n', label: '↵ (Nova linha)', title: 'Quebra de linha' },
];

export const DURATION_OPTIONS: DurationOption[] = [
  { id: 'whole', label: '1/1', namePt: 'Semibreve (4 tempos)', beats: 4, symbol: '𝅝', dashes: ' - - -' },
  { id: 'half', label: '1/2', namePt: 'Mínima (2 tempos)', beats: 2, symbol: '𝅗𝅥', dashes: ' -' },
  { id: 'quarter', label: '1/4', namePt: 'Semínima (1 tempo)', beats: 1, symbol: '♩', dashes: '' },
  { id: 'eighth', label: '1/8', namePt: 'Colcheia (1/2 tempo)', beats: 0.5, symbol: '♪', dashes: '' },
  { id: 'sixteenth', label: '1/16', namePt: 'Semicolcheia (1/4 tempo)', beats: 0.25, symbol: '𝅘𝅥𝅯', dashes: '' },
];

export function getNotesForKey(ocarinaKey: OcarinaKey): {
  naturals: OcarinaNote[];
  accidentals: OcarinaNote[];
  all: OcarinaNote[];
  byKey: Record<string, OcarinaNote>;
  full: OcarinaNote[];
  half: OcarinaNote[];
} {
  const data = KEY_DATA[ocarinaKey];

  const naturals: OcarinaNote[] = data.full.map((item) => ({
    key: item.key,
    label: item.label,
    pitch: item.label,
    holes: HOLE_MAP[item.key] || [],
    midi: item.midi,
    frequency: midiToFrequency(item.midi),
    isAccidental: false,
    isHalf: false,
  }));

  const accidentals: OcarinaNote[] = data.half.map((item) => ({
    key: item.key,
    label: item.label,
    pitch: item.label,
    holes: HOLE_MAP[item.key] || [],
    midi: item.midi,
    frequency: midiToFrequency(item.midi),
    isAccidental: true,
    isHalf: true,
  }));

  const all = [...naturals, ...accidentals];
  const byKey: Record<string, OcarinaNote> = {};
  all.forEach((n) => {
    byKey[n.key] = n;
  });

  return { naturals, accidentals, all, byKey, full: naturals, half: accidentals };
}

// Coordenadas padrão para o diagrama SVG da ocarina de 12 furos
export const OCARINA_SVG_VIEWBOX = '0 0 667.19885 639.57246';
export const OCARINA_BODY_PATH =
  'm 161.07364,839.29189 c 4.60775,-25.31839 14.70687,-48.88362 14.29735,-74.70252 -0.42966,-27.08884 -8.95859,-56.2201 -28.08294,-74.61568 C 111.57972,655.62607 32.856251,644.00424 -7.079348,633.96903 -20.084354,630.70107 -46.014437,621.95402 -51.195849,609.75358 -60.378035,588.1327 -23.531814,543.72104 2.6650519,521.19353 83.988076,451.26134 177.85986,407.35826 272.95089,365.17361 370.62933,321.84114 537.47118,263.31602 571.95578,258.70058 c 9.66603,-1.29371 17.39465,10.80039 13.54155,18.10347 -12.73857,24.14441 -56.29397,85.36775 -87.54777,126.93992 -53.44438,71.08892 -108.13827,140.6073 -153.98541,216.31622 -30.34074,50.10267 -57.08087,102.58176 -79.63992,156.63663 -10.89346,26.10234 -16.12816,54.3311 -26.71987,80.53601 -3.22286,7.97363 -11.48018,12.93522 -18.06556,12.94322 -14.41456,0.0181 -34.097,-4.2477 -48.78846,-11.36519 -6.64334,-3.21848 -11.08417,-11.78524 -9.6767,-19.51897 z';

export interface HoleDefinition {
  id: number;
  cx: number;
  cy: number;
  r: number;
  name: string;
  isThumb?: boolean;
  isSubHole?: boolean;
}

export const HOLES_CONFIG_VARIANT_1: HoleDefinition[] = [
  { id: 1, cx: 483.9567, cy: 341.72675, r: 35, name: 'Mão Direita - Indicador' },
  { id: 2, cx: 422.28571, cy: 409.82599, r: 35, name: 'Mão Direita - Médio' },
  { id: 3, cx: 368.82382, cy: 480.86005, r: 35, name: 'Mão Direita - Anelar' },
  { id: 4, cx: 322.06818, cy: 557.62213, r: 35, name: 'Mão Direita - Mínimo' },
  { id: 5, cx: 191.37856, cy: 492.23453, r: 35, name: 'Mão Esquerda - Mínimo' },
  { id: 6, cx: 114.08487, cy: 544.82562, r: 35, name: 'Mão Esquerda - Anelar' },
  { id: 7, cx: 23.995222, cy: 573.77948, r: 36, name: 'Mão Esquerda - Indicador' },
  { id: 8, cx: 75.195778, cy: 758.08392, r: 36, name: 'Polegar Esquerdo', isThumb: true },
  { id: 9, cx: 369.48151, cy: 758.08392, r: 36, name: 'Polegar Direito', isThumb: true },
  { id: 10, cx: 253.07832, cy: 423.18524, r: 35, name: 'Mão Esquerda - Médio' },
  { id: 11, cx: 155.32056, cy: 596.22955, r: 20, name: 'Sub-furo Esquerdo', isSubHole: true },
  { id: 12, cx: 317.47784, cy: 441.22519, r: 20, name: 'Sub-furo Direito', isSubHole: true },
];

export const SAMPLE_SONGS: SampleSong[] = [
  // ==========================================
  // CANÇÕES MÁGICAS DE OCARINA OF TIME
  // ==========================================
  {
    id: 'zeldas-lullaby',
    title: "Zelda's Lullaby",
    category: 'Canções Mágicas de OoT',
    key: 'C',
    suggestedKey: 'C',
    bpm: 100,
    font: '1',
    fontSize: 54,
    fontSizeUnit: 'px',
    description: 'Tema lendário da Princesa Zelda e da Família Real de Hyrule (Ocarina of Time)',
    tabs: 'H - P - K - - -\nH - P - K - - -\nH - P - R - P - K - - -\nI - H - F - - -\nH - P - K - - -\nH - P - K - - -\nH - P - R - P - T - - -\nR - - - P - - -',
  },
  {
    id: 'song-of-time',
    title: 'Song of Time',
    category: 'Canções Mágicas de OoT',
    key: 'C',
    suggestedKey: 'C',
    bpm: 115,
    font: '1',
    fontSize: 54,
    fontSizeUnit: 'px',
    description: 'Canção sagrada do Templo do Tempo para abrir as Portas do Tempo',
    tabs: 'M - F - I - - -\nM - F - I - - -\nM - P - O - - -\nK - - - I - - -\nH - F - H - I - F - - -',
  },
  {
    id: 'song-of-storms',
    title: 'Song of Storms',
    category: 'Canções Mágicas de OoT',
    key: 'C',
    suggestedKey: 'C',
    bpm: 135,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Canção das Tempestades que invoca chuvas e gira o Moinho de Kakariko',
    tabs: 'F - I - R - - -\nF - I - R - - -\nT - U T U T P M - - -\nM - - - F - I - K - H - - -\nF - - - - - - -',
  },
  {
    id: 'sarias-song',
    title: "Saria's Song (Lost Woods)",
    category: 'Canções Mágicas de OoT',
    key: 'C',
    suggestedKey: 'C',
    bpm: 140,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Música alegre da floresta dos Kokiri e dos Bosques Perdidos (Lost Woods)',
    tabs: 'I M O - - -\nI M O - - -\nI M O T R - - -\nO P O K H - - -\nF - H - K - H - - -',
  },
  {
    id: 'eponas-song',
    title: "Epona's Song",
    category: 'Canções Mágicas de OoT',
    key: 'C',
    suggestedKey: 'C',
    bpm: 95,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Melodia suave de Malon que chama a égua Epona no Rancho Lon Lon',
    tabs: 'R - O - M - - -\nR - O - M - - -\nR - O - M - O - M - - -\nR - O - M - - -\nR - O - M - - -\nR - O - M - O - M - - -\nO - P - R - - -\nP - O - M - - -\nO - M - K - - -\nM - - - - - - -',
  },
  {
    id: 'suns-song',
    title: "Sun's Song",
    category: 'Canções Mágicas de OoT',
    key: 'C',
    suggestedKey: 'C',
    bpm: 130,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Canção da Tumba Real que faz o sol nascer ou a noite cair instantaneamente',
    tabs: 'M - I - R - - -\nM - I - R - - -\nM - R - T - U - - -\nT - R - P - O - M - - -\nK - M - O - P - R - - -\nM - - - - - - -',
  },

  // ==========================================
  // MÚSICAS DE TELEPORTE (OCARINA OF TIME)
  // ==========================================
  {
    id: 'minuet-of-forest',
    title: 'Minuet of Forest',
    category: 'Músicas de Teleporte (OoT)',
    key: 'C',
    suggestedKey: 'C',
    bpm: 110,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Teleporta Link para o Templo da Floresta no Bosque Sagrado',
    tabs: 'F - R - O - - -\nM - O - M - - -\nF - R - O - - -\nM - O - M - - -\nH - I - K - M - O - - -\nP - - - R - - -',
  },
  {
    id: 'bolero-of-fire',
    title: 'Bolero of Fire',
    category: 'Músicas de Teleporte (OoT)',
    key: 'C',
    suggestedKey: 'C',
    bpm: 110,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Teleporta Link para a Cratera da Montanha da Morte (Templo do Fogo)',
    tabs: 'I F I F M - I -\nM - I - - - - -\nI F I F M - I -\nM - I - - - - -\nI - K - M - P -\nO - - - - - - -',
  },
  {
    id: 'serenade-of-water',
    title: 'Serenade of Water',
    category: 'Músicas de Teleporte (OoT)',
    key: 'C',
    suggestedKey: 'C',
    bpm: 100,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Teleporta Link para as águas do Lago Hylia (Templo da Água)',
    tabs: 'F - I - M - - -\nM - O - - - - -\nF - I - M - - -\nM - O - - - - -\nP - O - M - I -\nK - - - - - - -\nF - I - M - - -\nM - O - - - - -',
  },
  {
    id: 'requiem-of-spirit',
    title: 'Requiem of Spirit',
    category: 'Músicas de Teleporte (OoT)',
    key: 'C',
    suggestedKey: 'C',
    bpm: 90,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Teleporta Link para o Colosso do Deserto (Templo do Espírito)',
    tabs: 'F - I - F - - -\nM - I - F - - -\nF - I - F - - -\nM - I - F - - -\nI - K - M - O -\nM - - - - - - -\nK - I - H - - -\nF - - - - - - -',
  },
  {
    id: 'nocturne-of-shadow',
    title: 'Nocturne of Shadow',
    category: 'Músicas de Teleporte (OoT)',
    key: 'C',
    suggestedKey: 'C',
    bpm: 95,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Teleporta Link para o Cemitério de Kakariko (Templo das Sombras)',
    tabs: 'O - M - M - - -\nF - - - O - M -\nI - - - - - - -\nO - M - M - - -\nF - - - O - M -\nI - - - - - - -\nH - I - H - F -\nD - - - - - - -',
  },
  {
    id: 'prelude-of-light',
    title: 'Prelude of Light',
    category: 'Músicas de Teleporte (OoT)',
    key: 'C',
    suggestedKey: 'C',
    bpm: 110,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Teleporta Link de volta ao pedestal do Templo do Tempo',
    tabs: 'R - M - R - M -\nO - - - R - - -\nR - M - R - M -\nO - - - R - - -\nT - R - P - O -\nP - - - R - - -',
  },

  // ==========================================
  // CANÇÕES DE MAJORA'S MASK & TEMAS CLÁSSICOS
  // ==========================================
  {
    id: 'song-of-healing',
    title: 'Song of Healing',
    category: "Majora's Mask & Temas Clássicos",
    key: 'C',
    suggestedKey: 'C',
    bpm: 90,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Canção melancólica que cura espíritos e almas atormentadas (Majora’s Mask)',
    tabs: 'O - M - I - - -\nO - M - I - - -\nO - M - I - F - H - - -\nO - M - I - - -\nO - M - I - - -\nH - F - H - I - M - - -\nO - - - - - - -',
  },
  {
    id: 'song-of-soaring',
    title: 'Song of Soaring',
    category: "Majora's Mask & Temas Clássicos",
    key: 'C',
    suggestedKey: 'C',
    bpm: 125,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Permite voar e se teleportar entre as estátuas de coruja de Termina',
    tabs: 'I - O - R - - -\nI - O - R - - -\nI - O - R - T -\nR - - - O - - -\nM - O - M - I -\nF - - - - - - -',
  },
  {
    id: 'oath-to-order',
    title: 'Oath to Order',
    category: "Majora's Mask & Temas Clássicos",
    key: 'C',
    suggestedKey: 'C',
    bpm: 85,
    font: '1',
    fontSize: 52,
    fontSizeUnit: 'px',
    description: 'Invoca os Quatro Gigantes Guardiões para deter a queda da Lua em Termina',
    tabs: 'M - I - F - I -\nM - - - R - - -\nM - I - F - I -\nM - - - R - - -\nT - R - P - O -\nM - - - - - - -',
  },
  {
    id: 'clocktown',
    title: 'Clocktown Theme',
    category: "Majora's Mask & Temas Clássicos",
    key: 'C',
    suggestedKey: 'C',
    bpm: 120,
    font: '1',
    fontSize: 50,
    fontSizeUnit: 'px',
    description: 'Tema alegre do 1º Dia na Praça de Termina (Majora’s Mask)',
    tabs: 'D F H P\nO K I F\nH K P R\nT - - -',
  },
  {
    id: 'gerudo-valley',
    title: 'Gerudo Valley',
    category: "Majora's Mask & Temas Clássicos",
    key: 'C',
    suggestedKey: 'C',
    bpm: 145,
    font: '1',
    fontSize: 50,
    fontSizeUnit: 'px',
    description: 'Tema rítmico e espanhol da fortaleza das guerreiras Gerudo',
    tabs: 'F - I - M - - -\nR - P - M - - -\nI - K - M - - -\nK - I - H - - -\nF - I - M - - -\nR - T - R - - -\nP - O - M - - -\nO - - - - - - -',
  },
  {
    id: 'great-fairys-fountain',
    title: "Great Fairy's Fountain",
    category: "Majora's Mask & Temas Clássicos",
    key: 'C',
    suggestedKey: 'C',
    bpm: 120,
    font: '1',
    fontSize: 48,
    fontSizeUnit: 'px',
    description: 'Arpeggios celestiais da Fonte das Fadas e tela de seleção de arquivo',
    tabs: 'F I M P R P M I\nD H K O P O K H\nC F I M O M I F\nA D H K M K H D',
  },
];

export const getKeyNotes = getNotesForKey;
export const RHYTHM_DURATIONS = DURATION_OPTIONS;
export const SONG_PRESETS = SAMPLE_SONGS;
export const GLYPH_HOLES = HOLE_MAP;

