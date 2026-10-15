import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NoteToolbar } from './components/NoteToolbar/NoteToolbar';
import { VisualPicker } from './components/VisualPicker/VisualPicker';
import { RhythmControl } from './components/RhythmControl/RhythmControl';
import { TabEditor } from './components/TabEditor/TabEditor';
import { InteractiveOcarinaModal } from './components/OcarinaDiagram/InteractiveOcarinaModal';
import { ThemeSelector } from './components/ThemeSelector/ThemeSelector';
import { DURATION_OPTIONS, SAMPLE_SONGS, getNotesForKey } from './constants/ocarinaData';
import type { DurationOption, FontVariant, FontSizeUnit, OcarinaKey, OcarinaNote, SampleSong } from './types/ocarina';
import { parseUrlParams, serializeUrlParams, toggleSectionLigature } from './utils/ocarinaParser';
import { exportTabAsImage } from './utils/canvasExport';
import { playOcarinaFrequency, setMuted } from './audio/ocarinaAudio';
import { Sparkles, BookOpen, Check, Eye } from 'lucide-react';

export function App() {
  // Configurações principais da tablatura
  const [title, setTitle] = useState("Zelda's Lullaby");
  const [tabText, setTabText] = useState(SAMPLE_SONGS[0].tabs);
  const [ocarinaKey, setOcarinaKey] = useState<OcarinaKey>('C');
  const [fontVariant, setFontVariant] = useState<FontVariant>('1');
  const [fontSize, setFontSize] = useState<number>(54);
  const [fontSizeUnit, setFontSizeUnit] = useState<FontSizeUnit>('px');
  const [bpm, setBpm] = useState<number>(100);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // Estados de ferramentas & áudio
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[2]); // Semínima (1 tempo)
  const [autoSustainEnabled, setAutoSustainEnabled] = useState<boolean>(false);
  const [showMiniDiagrams, setShowMiniDiagrams] = useState<boolean>(true);
  const [activeTabMode, setActiveTabMode] = useState<'editor' | 'visual'>('editor');
  const [isInteractiveModalOpen, setIsInteractiveModalOpen] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Histórico para Undo/Redo
  const [history, setHistory] = useState<string[]>([SAMPLE_SONGS[0].tabs]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const editorRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  }, []);

  useEffect(() => {
    const params = parseUrlParams(window.location.search);
    if (params.tabs) {
      setTabText(params.tabs);
      setHistory([params.tabs]);
      setHistoryIndex(0);
    }
    if (params.name) setTitle(params.name);
    if (params.key) setOcarinaKey(params.key);
    if (params.font) setFontVariant(params.font);
    if (params.size) setFontSize(params.size);
    if (params.unit) setFontSizeUnit(params.unit);
    if (params.bpm) setBpm(params.bpm);
    if (params.readonly !== undefined) setReadOnly(params.readonly);
  }, []);

  useEffect(() => {
    setMuted(!soundEnabled);
  }, [soundEnabled]);

  const updateTabTextWithHistory = useCallback(
    (newText: string) => {
      setTabText(newText);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        if (sliced[sliced.length - 1] !== newText) {
          sliced.push(newText);
          setHistoryIndex(sliced.length - 1);
        }
        return sliced;
      });
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTabText(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTabText(history[newIndex]);
    }
  }, [historyIndex, history]);

  const insertChar = useCallback(
    (char: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      let textToInsert = char;
      const isNote = /^[A-U]$/.test(char);
      if (isNote && autoSustainEnabled && selectedDuration.dashes) {
        textToInsert = char + selectedDuration.dashes + ' ';
      }

      editor.focus();
      document.execCommand('insertText', false, textToInsert);
      updateTabTextWithHistory(editor.innerText);
    },
    [autoSustainEnabled, selectedDuration, updateTabTextWithHistory]
  );

  const handleInsertNote = useCallback(
    (noteOrKey: OcarinaNote | string) => {
      const keyChar = typeof noteOrKey === 'string' ? noteOrKey : noteOrKey.key;
      insertChar(keyChar);
    },
    [insertChar]
  );

  const handleToggleSection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const toggled = toggleSectionLigature(selectedText);
      document.execCommand('insertText', false, toggled);
      if (editorRef.current) {
        updateTabTextWithHistory(editorRef.current.innerText);
      }
    } else {
      showToast('Selecione primeiro as notas para aplicar a ligadura (︵)');
    }
  }, [updateTabTextWithHistory, showToast]);

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (soundEnabled && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const { byKey } = getNotesForKey(ocarinaKey);
      const note = byKey[e.key.toUpperCase()];
      if (note) {
        playOcarinaFrequency(note.frequency, 0.4);
      }
    }
  };

  const handleLoadSample = (song: SampleSong) => {
    setTitle(song.title);
    setTabText(song.tabs);
    setOcarinaKey(song.key);
    setFontVariant(song.font);
    setFontSize(song.fontSize);
    setFontSizeUnit(song.fontSizeUnit);
    setBpm(song.bpm);
    setHistory([song.tabs]);
    setHistoryIndex(0);
    showToast(`Canção "${song.title}" carregada!`);
  };

  const handleSaveImage = async () => {
    try {
      await exportTabAsImage({
        title,
        tabText,
        fontSize,
        fontSizeUnit,
        fontVariant,
        filename: `${title.toLowerCase().replace(/\s+/g, '_')}_ocarina_tab.png`,
      });
      showToast('Imagem PNG gerada e baixada com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar imagem.');
    }
  };

  const handleSaveText = () => {
    const blob = new Blob([tabText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_ocarina_tab.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast('Arquivo de texto baixado!');
  };

  const handleOpenTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content !== undefined) {
        updateTabTextWithHistory(content);
        showToast('Arquivo de texto carregado no editor!');
      }
    };
    reader.readAsText(file);
  };

  const handleShareLink = () => {
    const query = serializeUrlParams({
      name: title,
      tabs: tabText,
      key: ocarinaKey,
      font: fontVariant,
      size: fontSize,
      unit: fontSizeUnit,
      bpm,
    });
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link da tablatura copiado para a área de transferência! 🔗');
    });
  };

  const handleShareEmbed = () => {
    const query = serializeUrlParams({
      name: title,
      tabs: tabText,
      key: ocarinaKey,
      font: fontVariant,
      size: fontSize,
      unit: fontSizeUnit,
      bpm,
      readonly: true,
    });
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    const embedCode = `<iframe src="${url}" width="800" height="600" style="border:1px solid #e5e7eb; border-radius:12px;" allow="autoplay"></iframe>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      showToast('Código de incorporação (Embed IFrame) copiado! ‹/›');
    });
  };

  return (
    <div className="min-h-screen bg-base-300/30 text-base-content flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-top toast-center z-50 animate-bounce">
          <div className="alert alert-success shadow-lg text-sm font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header / Navbar */}
      <header className="navbar bg-base-100 border-b border-base-200 px-4 sm:px-8 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="navbar-start flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl filter drop-shadow">🪈</span>
            <div>
              <h1 className="font-black text-lg sm:text-xl tracking-tight leading-none bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ocarina Tabs Studio
              </h1>
              <p className="text-[11px] text-base-content/60 font-medium">
                12-Hole Ocarina Tablatura & Sound Synthesizer
              </p>
            </div>
          </div>
        </div>

        <div className="navbar-center hidden lg:flex items-center gap-2">
          {/* Menu de Canções de Exemplo */}
          <div className="dropdown dropdown-hover">
            <button tabIndex={0} className="btn btn-sm btn-ghost gap-1.5 font-semibold">
              <BookOpen className="w-4 h-4 text-primary" />
              Canções Populares
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-30 menu p-2 shadow-xl bg-base-100 rounded-box w-64 border border-base-200"
            >
              <li className="menu-title text-xs">Temas de The Legend of Zelda</li>
              {SAMPLE_SONGS.map((song) => (
                <li key={song.id}>
                  <button onClick={() => handleLoadSample(song)} className="flex flex-col items-start py-2">
                    <span className="font-bold text-xs">{song.title}</span>
                    <span className="text-[10px] text-base-content/60">{song.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Alternador de Modo: Editor vs Seletor Visual */}
          <div className="join join-horizontal bg-base-200 p-0.5 rounded-xl border border-base-300">
            <button
              onClick={() => setActiveTabMode('editor')}
              className={`btn btn-xs join-item rounded-lg ${
                activeTabMode === 'editor' ? 'btn-primary shadow-sm' : 'btn-ghost'
              }`}
            >
              Modo Editor
            </button>
            <button
              onClick={() => setActiveTabMode('visual')}
              className={`btn btn-xs join-item rounded-lg gap-1 ${
                activeTabMode === 'visual' ? 'btn-primary shadow-sm' : 'btn-ghost'
              }`}
            >
              <Eye className="w-3 h-3" />
              Seletor por Furinhos
            </button>
          </div>
        </div>

        <div className="navbar-end flex items-center gap-2">
          {/* Botão para abrir o Explorador Interativo */}
          <button
            onClick={() => setIsInteractiveModalOpen(true)}
            className="btn btn-sm btn-secondary btn-outline hidden sm:flex gap-1.5"
            title="Abrir ocarina interativa onde você clica nos furos"
          >
            <Sparkles className="w-4 h-4" />
            Explorar Furinhos
          </button>

          {/* Seletor de Temas DaisyUI */}
          <ThemeSelector />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        {/* Banner de apresentação sutil */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-base-100 rounded-2xl border border-primary/20 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center text-xl shadow-md">
              🎵
            </div>
            <div>
              <h2 className="font-bold text-sm text-base-content">
                Crie e pratique tablaturas para Ocarina de 12 Furos
              </h2>
              <p className="text-xs text-base-content/70">
                Toque notas com som acústico realista, escolha posições visualmente e defina tempos para as notas!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInteractiveModalOpen(true)}
              className="btn btn-xs btn-primary gap-1 sm:hidden"
            >
              <Sparkles className="w-3 h-3" /> Explorar Furos
            </button>
          </div>
        </div>

        {/* Note Toolbar: Tonalidade, Fonte, Tamanho, Botões de Notas */}
        <NoteToolbar
          ocarinaKey={ocarinaKey}
          onKeyChange={setOcarinaKey}
          fontVariant={fontVariant}
          onFontVariantChange={setFontVariant}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          fontSizeUnit={fontSizeUnit}
          onFontSizeUnitChange={setFontSizeUnit}
          onInsertChar={insertChar}
          onToggleSection={handleToggleSection}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          showMiniDiagrams={showMiniDiagrams}
          onToggleMiniDiagrams={() => setShowMiniDiagrams(!showMiniDiagrams)}
        />

        {/* Seletor Visual de Furinhos (Exibido se o usuário escolheu modo visual ou toggled) */}
        {activeTabMode === 'visual' && (
          <div className="animate-fade-in print:hidden">
            <VisualPicker
              ocarinaKey={ocarinaKey}
              onSelectNote={handleInsertNote}
              onOpenInteractiveModal={() => setIsInteractiveModalOpen(true)}
              soundEnabled={soundEnabled}
            />
          </div>
        )}

        {/* Rhythm & Tempo Control: Duração de Nota, BPM, Playback Melódico */}
        <RhythmControl
          bpm={bpm}
          onBpmChange={setBpm}
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
          autoSustainEnabled={autoSustainEnabled}
          onToggleAutoSustain={setAutoSustainEnabled}
          tabText={tabText}
          ocarinaKey={ocarinaKey}
          soundEnabled={soundEnabled}
        />

        {/* Tablatura Editor */}
        <TabEditor
          title={title}
          onTitleChange={setTitle}
          tabText={tabText}
          onTabTextChange={updateTabTextWithHistory}
          fontVariant={fontVariant}
          fontSize={fontSize}
          fontSizeUnit={fontSizeUnit}
          readOnly={readOnly}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSaveImage={handleSaveImage}
          onSaveText={handleSaveText}
          onOpenTextFile={handleOpenTextFile}
          onShareLink={handleShareLink}
          onShareEmbed={handleShareEmbed}
          onPrint={() => window.print()}
          onClear={() => updateTabTextWithHistory('')}
          editorRef={editorRef}
          onEditorKeyDown={handleEditorKeyDown}
        />
      </main>

      {/* Interactive Modal: Clique nos furos individuais para compor e ouvir */}
      <InteractiveOcarinaModal
        isOpen={isInteractiveModalOpen}
        onClose={() => setIsInteractiveModalOpen(false)}
        ocarinaKey={ocarinaKey}
        onInsertNote={handleInsertNote}
      />

      {/* Footer */}
      <footer className="footer footer-center p-6 bg-base-100 text-base-content/70 border-t border-base-200 text-xs print:hidden">
        <div className="flex flex-col items-center gap-1">
          <p>
            <strong>Ocarina Tabs Studio</strong> • Desenvolvido com React 19, TypeScript, DaisyUI e Web Audio API.
          </p>
          <p className="text-base-content/50">
            Fontes e vetores originais por Mathias Panzenböck (OFL 1.1) • Desenvolvido com carinho por{' '}
            <a
              href="https://github.com/ApenasGabs"
              target="_blank"
              rel="noreferrer"
              className="link link-hover font-semibold text-primary"
            >
              @ApenasGabs
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
