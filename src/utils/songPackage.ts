import type { FontSizeUnit, FontVariant, OcarinaKey } from '../types/ocarina';

export interface OcarinaSongMetadata {
  title: string;
  artist?: string;
  author?: string;
  key: OcarinaKey;
  bpm: number;
  font: FontVariant;
  fontSize: number;
  fontSizeUnit: FontSizeUnit;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OcarinaSongPackage {
  version: '1.0';
  type: 'ocarina-song';
  metadata: OcarinaSongMetadata;
  content: {
    tabs: string;
  };
}

export interface OcarinaLibraryBackup {
  version: '1.0';
  type: 'ocarina-library-backup';
  exportedAt: string;
  songs: OcarinaSongPackage[];
}

export interface SongPackageInput {
  title: string;
  artist?: string;
  author?: string;
  key: OcarinaKey;
  bpm: number;
  font: FontVariant;
  fontSize: number;
  fontSizeUnit: FontSizeUnit;
  description?: string;
  tabs: string;
}

/**
 * Cria um objeto estruturado de canção .otab
 */
export function createSongPackage(input: SongPackageInput): OcarinaSongPackage {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    type: 'ocarina-song',
    metadata: {
      title: input.title || 'Sem Título',
      artist: input.artist || '',
      author: input.author || '',
      key: input.key || 'C',
      bpm: input.bpm || 100,
      font: input.font || '1',
      fontSize: input.fontSize || 54,
      fontSizeUnit: input.fontSizeUnit || 'px',
      description: input.description || '',
      createdAt: now,
      updatedAt: now,
    },
    content: {
      tabs: input.tabs || '',
    },
  };
}

/**
 * Valida se um objeto ou string JSON é um pacote válido de canção (.otab)
 */
export function validateSongPackage(data: unknown): OcarinaSongPackage | null {
  if (!data || typeof data !== 'object') return null;

  const pkg = data as Partial<OcarinaSongPackage>;
  if (pkg.type !== 'ocarina-song' || !pkg.metadata || !pkg.content) {
    return null;
  }

  const meta = pkg.metadata;
  if (typeof meta.title !== 'string' || typeof pkg.content.tabs !== 'string') {
    return null;
  }

  const validKey = meta.key === 'C' || meta.key === 'F' || meta.key === 'G' ? meta.key : 'C';
  const validFont = meta.font === '1' || meta.font === '2' ? meta.font : '1';

  return {
    version: '1.0',
    type: 'ocarina-song',
    metadata: {
      title: meta.title || 'Canção Importada',
      artist: meta.artist || '',
      author: meta.author || '',
      key: validKey,
      bpm: Number(meta.bpm) || 120,
      font: validFont,
      fontSize: Number(meta.fontSize) || 54,
      fontSizeUnit: (meta.fontSizeUnit as FontSizeUnit) || 'px',
      description: meta.description || '',
      createdAt: meta.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    content: {
      tabs: pkg.content.tabs,
    },
  };
}

/**
 * Cria um pacote de backup com múltiplas canções
 */
export function createLibraryBackup(songs: SongPackageInput[]): OcarinaLibraryBackup {
  return {
    version: '1.0',
    type: 'ocarina-library-backup',
    exportedAt: new Date().toISOString(),
    songs: songs.map((s) => createSongPackage(s)),
  };
}

/**
 * Valida se um objeto é um backup válido de biblioteca
 */
export function validateLibraryBackup(data: unknown): OcarinaLibraryBackup | null {
  if (!data || typeof data !== 'object') return null;

  const b = data as Partial<OcarinaLibraryBackup>;
  if (b.type !== 'ocarina-library-backup' || !Array.isArray(b.songs)) {
    return null;
  }

  const validSongs: OcarinaSongPackage[] = [];
  for (const item of b.songs) {
    const validated = validateSongPackage(item);
    if (validated) {
      validSongs.push(validated);
    }
  }

  return {
    version: '1.0',
    type: 'ocarina-library-backup',
    exportedAt: b.exportedAt || new Date().toISOString(),
    songs: validSongs,
  };
}

/**
 * Dispara o download de um pacote de canção (.otab / .json) no navegador
 */
export function downloadSongPackage(pkg: OcarinaSongPackage, customFilename?: string): void {
  const json = JSON.stringify(pkg, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const filename =
    customFilename ||
    `${(pkg.metadata.title || 'ocarina_song').toLowerCase().replace(/\s+/g, '_')}.otab`;

  triggerBrowserDownload(blob, filename);
}

/**
 * Dispara o download de um backup completo da biblioteca (.json)
 */
export function downloadLibraryBackup(backup: OcarinaLibraryBackup, customFilename?: string): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `ocarina_library_backup_${dateStr}.json`;

  triggerBrowserDownload(blob, filename);
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
