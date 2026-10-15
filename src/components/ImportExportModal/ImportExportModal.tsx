import React, { useState, useId, useEffect } from 'react';
import type { FontSizeUnit, FontVariant, OcarinaKey } from '../../types/ocarina';
import {
  Download,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { exportToAbc, isAbcNotation, parseAbc } from '../../utils/abcConverter';
import { isNoteText, parseNoteText } from '../../utils/noteTextConverter';
import {
  createLibraryBackup,
  createSongPackage,
  downloadLibraryBackup,
  downloadSongPackage,
  validateLibraryBackup,
  validateSongPackage,
} from '../../utils/songPackage';
import { exportTabAsMidi } from '../../utils/midiExport';
import { exportTabAsWav } from '../../utils/wavExport';
import { SAMPLE_SONGS } from '../../constants/ocarinaData';

export interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: {
    title: string;
    tabText: string;
    ocarinaKey: OcarinaKey;
    fontVariant: FontVariant;
    fontSize: number;
    fontSizeUnit: FontSizeUnit;
    bpm: number;
    description?: string;
  };
  onImportSong: (song: {
    title: string;
    tabText: string;
    ocarinaKey: OcarinaKey;
    bpm?: number;
    fontVariant?: FontVariant;
    fontSize?: number;
    fontSizeUnit?: FontSizeUnit;
    description?: string;
  }) => void;
  onSaveImage: () => void;
  initialTab?: 'import' | 'export';
}

type DetectedFormat =
  | 'abc'
  | 'anglo_notes'
  | 'solfege_notes'
  | 'ocarina_package'
  | 'library_backup'
  | 'ocarina_tab'
  | 'unknown';

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  onImportSong,
  onSaveImage,
  initialTab = 'import',
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab);

  // Estados de Importação
  const [rawInput, setRawInput] = useState('');
  const [targetKey, setTargetKey] = useState<OcarinaKey>(currentSong.ocarinaKey);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>('unknown');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewBpm, setPreviewBpm] = useState<number>(currentSong.bpm);
  const [previewTab, setPreviewTab] = useState('');
  const [previewNotesCount, setPreviewNotesCount] = useState(0);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [librarySongs, setLibrarySongs] = useState<Array<{ title: string; tabs: string; key: OcarinaKey; bpm: number }>>([]);
  const [selectedLibraryIndex, setSelectedLibraryIndex] = useState(0);

  // Estados de Exportação e Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRenderingWav, setIsRenderingWav] = useState(false);

  const fileInputId = useId();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setTargetKey(currentSong.ocarinaKey);
  }, [currentSong.ocarinaKey]);

  // Detector inteligente em tempo real
  useEffect(() => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      setDetectedFormat('unknown');
      setPreviewTitle('');
      setPreviewTab('');
      setPreviewNotesCount(0);
      setPreviewWarnings([]);
      setLibrarySongs([]);
      return;
    }

    // 1. Tenta JSON (Canção .otab ou Backup)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsedJson = JSON.parse(trimmed);

        const singlePkg = validateSongPackage(parsedJson);
        if (singlePkg) {
          setDetectedFormat('ocarina_package');
          setPreviewTitle(singlePkg.metadata.title);
          setTargetKey(singlePkg.metadata.key);
          setPreviewBpm(singlePkg.metadata.bpm);
          setPreviewTab(singlePkg.content.tabs);
          setPreviewNotesCount(singlePkg.content.tabs.replace(/[^A-U]/g, '').length);
          setPreviewWarnings([]);
          setLibrarySongs([]);
          return;
        }

        const libraryBackup = validateLibraryBackup(parsedJson);
        if (libraryBackup && libraryBackup.songs.length > 0) {
          setDetectedFormat('library_backup');
          const songsList = libraryBackup.songs.map((s) => ({
            title: s.metadata.title,
            tabs: s.content.tabs,
            key: s.metadata.key,
            bpm: s.metadata.bpm,
          }));
          setLibrarySongs(songsList);
          setSelectedLibraryIndex(0);
          const first = songsList[0];
          setPreviewTitle(first.title);
          setTargetKey(first.key);
          setPreviewBpm(first.bpm);
          setPreviewTab(first.tabs);
          setPreviewNotesCount(first.tabs.replace(/[^A-U]/g, '').length);
          setPreviewWarnings([`Backup contém ${songsList.length} canções prontas para restauração.`]);
          return;
        }
      } catch {
        // Não é JSON válido, prossegue para análise de texto
      }
    }

    // 2. Tenta ABC Notation
    if (isAbcNotation(trimmed)) {
      setDetectedFormat('abc');
      const abcRes = parseAbc(trimmed, targetKey);
      setPreviewTitle(abcRes.title);
      setPreviewBpm(abcRes.bpm);
      setPreviewTab(abcRes.tabText);
      setPreviewNotesCount(abcRes.notesCount);
      setPreviewWarnings(abcRes.warnings);
      setLibrarySongs([]);
      return;
    }

    // 3. Tenta Nomes de Notas / Cifras
    if (isNoteText(trimmed)) {
      const noteRes = parseNoteText(trimmed, targetKey);
      setDetectedFormat(noteRes.detectedNotation === 'solfege' ? 'solfege_notes' : 'anglo_notes');
      setPreviewTitle(currentSong.title ? `${currentSong.title} (Importada)` : 'Canção por Notas');
      setPreviewBpm(currentSong.bpm);
      setPreviewTab(noteRes.tabText);
      setPreviewNotesCount(noteRes.notesCount);

      const warnings: string[] = [];
      if (noteRes.unrecognizedTokens.length > 0) {
        warnings.push(
          `${noteRes.unrecognizedTokens.length} termos não musicais ignorados: ${noteRes.unrecognizedTokens
            .slice(0, 4)
            .join(', ')}...`
        );
      }
      setPreviewWarnings(warnings);
      setLibrarySongs([]);
      return;
    }

    // 4. Tablatura nativa da Ocarina (A-U)
    setDetectedFormat('ocarina_tab');
    setPreviewTitle(currentSong.title || 'Tablatura Ocarina');
    setPreviewBpm(currentSong.bpm);
    setPreviewTab(trimmed);
    setPreviewNotesCount(trimmed.replace(/[^A-U]/g, '').length);
    setPreviewWarnings([]);
    setLibrarySongs([]);
  }, [rawInput, targetKey, currentSong.title, currentSong.bpm]);

  // Troca de música em caso de backup de biblioteca
  const handleSelectLibrarySong = (idx: number) => {
    setSelectedLibraryIndex(idx);
    const s = librarySongs[idx];
    if (s) {
      setPreviewTitle(s.title);
      setTargetKey(s.key);
      setPreviewBpm(s.bpm);
      setPreviewTab(s.tabs);
      setPreviewNotesCount(s.tabs.replace(/[^A-U]/g, '').length);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        setRawInput(content);
        // Sugere título a partir do nome do arquivo
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setPreviewTitle(nameWithoutExt);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyImport = () => {
    if (!previewTab) return;

    onImportSong({
      title: previewTitle || 'Canção Importada',
      tabText: previewTab,
      ocarinaKey: targetKey,
      bpm: previewBpm || 120,
    });
    onClose();
  };

  // Funções de Cópia com feedback
  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  // Ações de Exportação
  const handleExportAbc = () => {
    const abcText = exportToAbc({
      title: currentSong.title,
      tabText: currentSong.tabText,
      ocarinaKey: currentSong.ocarinaKey,
      bpm: currentSong.bpm,
    });
    const blob = new Blob([abcText], { type: 'text/vnd.abc;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSong.title.toLowerCase().replace(/\s+/g, '_')}.abc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleExportOtab = () => {
    const pkg = createSongPackage({
      title: currentSong.title,
      tabs: currentSong.tabText,
      key: currentSong.ocarinaKey,
      bpm: currentSong.bpm,
      font: currentSong.fontVariant,
      fontSize: currentSong.fontSize,
      fontSizeUnit: currentSong.fontSizeUnit,
      description: currentSong.description,
    });
    downloadSongPackage(pkg);
  };

  const handleExportPlainText = () => {
    const blob = new Blob([currentSong.tabText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSong.title.toLowerCase().replace(/\s+/g, '_')}_ocarina_tab.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleExportMidi = () => {
    exportTabAsMidi({
      title: currentSong.title,
      tabText: currentSong.tabText,
      ocarinaKey: currentSong.ocarinaKey,
      bpm: currentSong.bpm,
    });
  };

  const handleExportWav = async () => {
    try {
      setIsRenderingWav(true);
      await exportTabAsWav({
        title: currentSong.title,
        tabText: currentSong.tabText,
        ocarinaKey: currentSong.ocarinaKey,
        bpm: currentSong.bpm,
      });
    } catch (err) {
      console.error('Erro ao sintetizar WAV:', err);
    } finally {
      setIsRenderingWav(false);
    }
  };

  const handleExportLibraryBackup = () => {
    // Inclui a canção atual + as canções de amostra em um backup abrangente
    const songsToBackup = [
      {
        title: currentSong.title,
        tabs: currentSong.tabText,
        key: currentSong.ocarinaKey,
        bpm: currentSong.bpm,
        font: currentSong.fontVariant,
        fontSize: currentSong.fontSize,
        fontSizeUnit: currentSong.fontSizeUnit,
      },
      ...SAMPLE_SONGS.map((s) => ({
        title: s.title,
        tabs: s.tabs,
        key: s.key,
        bpm: s.bpm,
        font: s.font,
        fontSize: s.fontSize,
        fontSizeUnit: s.fontSizeUnit,
        description: s.description,
      })),
    ];
    const backup = createLibraryBackup(songsToBackup);
    downloadLibraryBackup(backup);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-base-content leading-tight">
                Importação & Exportação Universal
              </h2>
              <p className="text-xs text-base-content/60">
                Importe e exporte partituras, cifras, solfejo, pacotes .otab, áudio e MIDI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternador de Abas */}
            <div className="join bg-base-300/60 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('import')}
                className={`btn btn-xs sm:btn-sm join-item rounded-lg gap-1.5 ${
                  activeTab === 'import' ? 'btn-primary shadow-sm' : 'btn-ghost'
                }`}
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`btn btn-xs sm:btn-sm join-item rounded-lg gap-1.5 ${
                  activeTab === 'export' ? 'btn-primary shadow-sm' : 'btn-ghost'
                }`}
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>

            <button
              onClick={onClose}
              className="btn btn-sm btn-ghost btn-circle ml-2"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ===================== ABA: IMPORTAR ===================== */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              {/* Barra de Formatos e Upload de Arquivo */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-base-200/40 rounded-2xl border border-base-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-base-content/70">Formatos aceitos:</span>
                  <span className="badge badge-sm badge-outline">.abc</span>
                  <span className="badge badge-sm badge-outline">.otab</span>
                  <span className="badge badge-sm badge-outline">.json</span>
                  <span className="badge badge-sm badge-outline">Cifras (C D E)</span>
                  <span className="badge badge-sm badge-outline">Solfejo (Dó Ré Mi)</span>
                  <span className="badge badge-sm badge-outline">.txt</span>
                </div>

                <div>
                  <input
                    type="file"
                    id={fileInputId}
                    onChange={handleFileUpload}
                    accept=".abc,.otab,.json,.txt,text/plain"
                    className="hidden"
                  />
                  <label
                    htmlFor={fileInputId}
                    className="btn btn-sm btn-outline btn-primary gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Carregar Arquivo do Disco
                  </label>
                </div>
              </div>

              {/* Textarea de Entrada */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Cole o texto da canção ou partitura:
                  </label>
                  {rawInput && (
                    <button
                      onClick={() => setRawInput('')}
                      className="text-xs text-error hover:underline"
                    >
                      Limpar entrada
                    </button>
                  )}
                </div>
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Cole aqui seu arquivo ABC, cifras (C D E), solfejo (Dó Ré Mi) ou pacote .otab / JSON..."
                  rows={6}
                  className="textarea textarea-bordered w-full font-mono text-xs sm:text-sm rounded-2xl focus:textarea-primary focus:outline-none"
                />
              </div>

              {/* Detector & Configuração de Afinação */}
              {rawInput.trim() && (
                <div className="p-4 bg-base-200/50 rounded-2xl border border-base-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-base-content/80">Formato Detectado:</span>
                      {detectedFormat === 'abc' && (
                        <span className="badge badge-success gap-1 text-xs font-bold py-3 px-3 shadow-sm">
                          🎼 ABC Notation (Universal)
                        </span>
                      )}
                      {detectedFormat === 'anglo_notes' && (
                        <span className="badge badge-info gap-1 text-xs font-bold py-3 px-3 shadow-sm">
                          🎸 Cifras Americanas (C, D, E)
                        </span>
                      )}
                      {detectedFormat === 'solfege_notes' && (
                        <span className="badge badge-secondary gap-1 text-xs font-bold py-3 px-3 shadow-sm">
                          🎤 Solfejo Latino (Dó, Ré, Mi)
                        </span>
                      )}
                      {detectedFormat === 'ocarina_package' && (
                        <span className="badge badge-warning gap-1 text-xs font-bold py-3 px-3 shadow-sm">
                          📦 Pacote de Canção (.otab)
                        </span>
                      )}
                      {detectedFormat === 'library_backup' && (
                        <span className="badge badge-accent gap-1 text-xs font-bold py-3 px-3 shadow-sm">
                          📚 Backup de Biblioteca (.json)
                        </span>
                      )}
                      {detectedFormat === 'ocarina_tab' && (
                        <span className="badge badge-neutral gap-1 text-xs font-bold py-3 px-3 shadow-sm">
                          🪈 Tablatura Nativa Ocarina (A-U)
                        </span>
                      )}
                    </div>

                    {/* Seletor de Afinação de Destino */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-base-content/70">Tom da Ocarina:</span>
                      <div className="join">
                        {(['C', 'F', 'G'] as OcarinaKey[]).map((k) => (
                          <button
                            key={k}
                            onClick={() => setTargetKey(k)}
                            className={`btn btn-xs join-item ${
                              targetKey === k ? 'btn-primary font-bold' : 'btn-ghost'
                            }`}
                          >
                            Ocarina {k}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Lista de Músicas do Backup (Se houver) */}
                  {librarySongs.length > 0 && (
                    <div className="space-y-2 p-3 bg-base-100 rounded-xl border border-base-300">
                      <span className="text-xs font-bold text-base-content">
                        Escolha uma canção do backup para importar:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {librarySongs.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectLibrarySong(idx)}
                            className={`btn btn-xs rounded-lg ${
                              selectedLibraryIndex === idx ? 'btn-primary' : 'btn-ghost bg-base-200'
                            }`}
                          >
                            {s.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadados Extraídos */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-base-content/60">Título da Canção</label>
                      <input
                        type="text"
                        value={previewTitle}
                        onChange={(e) => setPreviewTitle(e.target.value)}
                        className="input input-xs sm:input-sm input-bordered w-full rounded-lg font-bold"
                        placeholder="Nome da música..."
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-base-content/60">Andamento (BPM)</label>
                      <input
                        type="number"
                        value={previewBpm}
                        onChange={(e) => setPreviewBpm(Number(e.target.value))}
                        className="input input-xs sm:input-sm input-bordered w-full rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-base-content/60">Notas Extraídas</label>
                      <div className="text-xs sm:text-sm font-bold text-success flex items-center h-8 sm:h-9">
                        ✓ {previewNotesCount} notas reconhecidas
                      </div>
                    </div>
                  </div>

                  {/* Avisos & Otimizações */}
                  {previewWarnings.length > 0 && (
                    <div className="alert alert-warning text-xs p-2.5 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        {previewWarnings.map((w, i) => (
                          <p key={i}>{w}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pré-visualização da Tablatura Resultante */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-base-content/60">
                      Pré-visualização da digitação (Ocarina 12 Furos):
                    </span>
                    <div className="p-3 bg-base-100 rounded-xl border border-base-300 max-h-40 overflow-y-auto">
                      <p
                        className="whitespace-pre-wrap leading-relaxed tracking-wider text-xl text-primary font-normal"
                        style={{ fontFamily: `"Open 12 Hole Ocarina ${currentSong.fontVariant}", monospace` }}
                      >
                        {previewTab || 'Nenhuma nota identificada'}
                      </p>
                    </div>
                  </div>

                  {/* Botão de Confirmação */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleApplyImport}
                      disabled={!previewTab || previewNotesCount === 0}
                      className="btn btn-primary gap-2 shadow-md rounded-xl"
                    >
                      <Check className="w-4 h-4" />
                      Aplicar Tablatura no Estúdio
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== ABA: EXPORTAR ===================== */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="text-xs text-base-content/70">
                Escolha o formato universal desejado para compartilhar ou guardar sua canção:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. ABC Notation */}
                <div className="p-4 bg-base-200/40 rounded-2xl border border-base-200 hover:border-primary/50 transition-colors flex flex-col justify-between gap-3 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎼</span>
                        <h3 className="font-bold text-sm text-base-content">ABC Notation (.abc)</h3>
                      </div>
                      <span className="badge badge-sm badge-success font-semibold">Padrão Universal</span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1.5">
                      Partitura de texto padrão compatível com MuseScore, The Session, ABCjs e programas de notação musical.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleExportAbc}
                      className="btn btn-sm btn-primary flex-1 gap-1.5 rounded-xl shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar .abc
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          exportToAbc({
                            title: currentSong.title,
                            tabText: currentSong.tabText,
                            ocarinaKey: currentSong.ocarinaKey,
                            bpm: currentSong.bpm,
                          }),
                          'abc'
                        )
                      }
                      className="btn btn-sm btn-ghost btn-square"
                      title="Copiar texto ABC"
                    >
                      {copiedKey === 'abc' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Pacote de Canção Estruturado (.otab) */}
                <div className="p-4 bg-base-200/40 rounded-2xl border border-base-200 hover:border-primary/50 transition-colors flex flex-col justify-between gap-3 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📦</span>
                        <h3 className="font-bold text-sm text-base-content">Pacote Ocarina (.otab)</h3>
                      </div>
                      <span className="badge badge-sm badge-warning font-semibold">Fidelidade Total</span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1.5">
                      Arquivo JSON com metadados completos de título, afinação (C/F/G), andamento BPM, variante e tamanho de fonte.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleExportOtab}
                      className="btn btn-sm btn-warning flex-1 gap-1.5 rounded-xl text-warning-content shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar .otab
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(
                            createSongPackage({
                              title: currentSong.title,
                              tabs: currentSong.tabText,
                              key: currentSong.ocarinaKey,
                              bpm: currentSong.bpm,
                              font: currentSong.fontVariant,
                              fontSize: currentSong.fontSize,
                              fontSizeUnit: currentSong.fontSizeUnit,
                            }),
                            null,
                            2
                          ),
                          'otab'
                        )
                      }
                      className="btn btn-sm btn-ghost btn-square"
                      title="Copiar JSON do Pacote"
                    >
                      {copiedKey === 'otab' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Arquivo MIDI (.mid) */}
                <div className="p-4 bg-base-200/40 rounded-2xl border border-base-200 hover:border-primary/50 transition-colors flex flex-col justify-between gap-3 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎹</span>
                        <h3 className="font-bold text-sm text-base-content">Trilha MIDI (.mid)</h3>
                      </div>
                      <span className="badge badge-sm badge-secondary font-semibold">DAW / Estúdio</span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1.5">
                      Trilha MIDI Standard (SMF) com instrumento Ocarina (GM 79) e andamento para importar em Reaper, FL Studio ou Ableton.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleExportMidi}
                      className="btn btn-sm btn-secondary flex-1 w-full gap-1.5 rounded-xl shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar Arquivo MIDI (.mid)
                    </button>
                  </div>
                </div>

                {/* 4. Áudio Acústico WAV (.wav) */}
                <div className="p-4 bg-base-200/40 rounded-2xl border border-base-200 hover:border-primary/50 transition-colors flex flex-col justify-between gap-3 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎧</span>
                        <h3 className="font-bold text-sm text-base-content">Áudio Acústico (.wav)</h3>
                      </div>
                      <span className="badge badge-sm badge-accent font-semibold">44.1 kHz PCM</span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1.5">
                      Gravação com o som acústico sintetizado da ocarina, vibrato e respiração, gerada no navegador sem perda de qualidade.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleExportWav}
                      disabled={isRenderingWav}
                      className="btn btn-sm btn-accent flex-1 w-full gap-1.5 rounded-xl shadow-sm"
                    >
                      {isRenderingWav ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sintetizando Áudio...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" /> Gerar e Baixar WAV (.wav)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5. Imagem PNG da Partitura */}
                <div className="p-4 bg-base-200/40 rounded-2xl border border-base-200 hover:border-primary/50 transition-colors flex flex-col justify-between gap-3 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🖼️</span>
                        <h3 className="font-bold text-sm text-base-content">Imagem da Tablatura (.png)</h3>
                      </div>
                      <span className="badge badge-sm badge-outline font-semibold">Visual / Impressão</span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1.5">
                      Imagem de alta resolução pronta para compartilhar nas redes sociais ou imprimir em papel.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onSaveImage();
                        onClose();
                      }}
                      className="btn btn-sm btn-outline btn-primary w-full gap-1.5 rounded-xl shadow-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Gerar Imagem PNG
                    </button>
                  </div>
                </div>

                {/* 6. Texto Puro (.txt) */}
                <div className="p-4 bg-base-200/40 rounded-2xl border border-base-200 hover:border-primary/50 transition-colors flex flex-col justify-between gap-3 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📄</span>
                        <h3 className="font-bold text-sm text-base-content">Texto Puro da Fonte (.txt)</h3>
                      </div>
                      <span className="badge badge-sm badge-outline font-semibold">Código A-U</span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1.5">
                      Arquivo de texto com os caracteres originais da fonte da ocarina com ligaduras e marcações.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleExportPlainText}
                      className="btn btn-sm btn-ghost bg-base-300/60 flex-1 gap-1.5 rounded-xl shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar .txt
                    </button>
                    <button
                      onClick={() => copyToClipboard(currentSong.tabText, 'txt')}
                      className="btn btn-sm btn-ghost btn-square"
                      title="Copiar texto puro"
                    >
                      {copiedKey === 'txt' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card de Backup Completo */}
              <div className="p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-base-200 rounded-2xl border border-primary/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center text-xl shadow">
                    💾
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-base-content">Backup Completo da Biblioteca</h4>
                    <p className="text-xs text-base-content/70">
                      Exporte todas as suas canções em um único arquivo .json seguro para restaurar em qualquer navegador.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportLibraryBackup}
                  className="btn btn-sm btn-primary gap-1.5 rounded-xl shadow-md"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Backup da Biblioteca
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
