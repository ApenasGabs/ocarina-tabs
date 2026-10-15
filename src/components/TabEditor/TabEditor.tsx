import React, { useRef, useEffect } from 'react';
import type { FontVariant, FontSizeUnit } from '../../types/ocarina';
import { Undo, Redo, Download, Upload, Share2, Code, Printer, Trash2, Edit3 } from 'lucide-react';

export interface TabEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  tabText: string;
  onTabTextChange: (text: string) => void;
  fontVariant: FontVariant;
  fontSize: number;
  fontSizeUnit: FontSizeUnit;
  readOnly?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveImage: () => void;
  onSaveText: () => void;
  onOpenTextFile: (file: File) => void;
  onOpenImportExport?: (initialTab?: 'import' | 'export') => void;
  onShareLink: () => void;
  onShareEmbed: () => void;
  onPrint: () => void;
  onClear: () => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onEditorKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const TabEditor: React.FC<TabEditorProps> = ({
  title,
  onTitleChange,
  tabText,
  onTabTextChange,
  fontVariant,
  fontSize,
  fontSizeUnit,
  readOnly = false,
  onUndo,
  onRedo,
  onSaveImage,
  onSaveText,
  onOpenTextFile,
  onOpenImportExport,
  onShareLink,
  onShareEmbed,
  onPrint,
  onClear,
  editorRef,
  onEditorKeyDown,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== tabText) {
      editorRef.current.innerText = tabText;
    }
  }, [tabText, editorRef]);

  const handleInput = () => {
    if (editorRef.current) {
      onTabTextChange(editorRef.current.innerText);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenTextFile(file);
      e.target.value = '';
    }
  };

  const fontFamily = `"Open 12 Hole Ocarina ${fontVariant}", monospace`;

  return (
    <div className="flex flex-col bg-base-100 rounded-2xl border border-base-200 shadow-md overflow-hidden">
      {/* Editor Top Bar with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-base-200/60 border-b border-base-200 print:hidden">
        {/* Title Editor */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              className="input input-sm input-bordered font-bold text-base w-full max-w-sm rounded-lg"
              placeholder="Título da Canção..."
            />
          ) : (
            <div
              onClick={() => !readOnly && setIsEditingTitle(true)}
              className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-lg hover:bg-base-300/50 transition-colors"
              title="Clique para editar o título"
            >
              <h2 className="text-base font-bold text-base-content truncate max-w-md">
                {title || 'Sem Título (Clique para renomear)'}
              </h2>
              {!readOnly && (
                <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity" />
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {!readOnly && (
            <>
              <button
                onClick={onUndo}
                className="btn btn-sm btn-ghost btn-square"
                title="Desfazer (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={onRedo}
                className="btn btn-sm btn-ghost btn-square"
                title="Refazer (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>

              <div className="divider divider-horizontal my-1 mx-0.5"></div>
            </>
          )}

          {/* Import / Export Universal Modal trigger */}
          {onOpenImportExport && !readOnly && (
            <button
              onClick={() => onOpenImportExport('import')}
              className="btn btn-sm btn-ghost gap-1.5"
              title="Importar partituras universais (ABC Notation, Cifras C D E, Solfejo Dó Ré Mi, .otab)"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Importar</span>
            </button>
          )}

          {/* Export / Save dropdown */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-sm btn-primary gap-1.5 shadow-sm">
              <Download className="w-3.5 h-3.5" />
              Salvar / Baixar
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-64 border border-base-200 mt-1"
            >
              <li>
                <button onClick={onSaveImage}>
                  <span>🖼️</span> Salvar como Imagem (PNG)
                </button>
              </li>
              <li>
                <button onClick={onSaveText}>
                  <span>📄</span> Salvar como Texto (.txt)
                </button>
              </li>
              {onOpenImportExport && (
                <>
                  <div className="divider my-1"></div>
                  <li>
                    <button
                      onClick={() => onOpenImportExport('export')}
                      className="text-primary font-bold flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span>🎼</span> Mais Formatos...
                      </span>
                      <span className="badge badge-primary badge-xs">ABC/MIDI/WAV</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Open Text File */}
          {!readOnly && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,text/plain"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-sm btn-ghost btn-square"
                title="Abrir arquivo de texto (.txt)"
              >
                <Upload className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Share */}
          <button
            onClick={onShareLink}
            className="btn btn-sm btn-ghost btn-square"
            title="Compartilhar Link da Tablatura"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Embed */}
          <button
            onClick={onShareEmbed}
            className="btn btn-sm btn-ghost btn-square"
            title="Copiar código Embed (IFrame)"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Print */}
          <button
            onClick={onPrint}
            className="btn btn-sm btn-ghost btn-square"
            title="Imprimir Tablatura"
          >
            <Printer className="w-4 h-4" />
          </button>

          {!readOnly && (
            <button
              onClick={onClear}
              className="btn btn-sm btn-ghost btn-square text-error hover:bg-error/10"
              title="Limpar Editor"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Print-only title */}
      <div className="hidden print:block text-center py-4 border-b border-gray-300">
        <h1 className="text-2xl font-black">{title || '12-Hole Ocarina Tab'}</h1>
      </div>

      {/* Editor ContentEditable Canvas */}
      <div className="relative p-6 sm:p-8 min-h-[380px] flex-1 bg-base-100 overflow-x-auto">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          onKeyDown={onEditorKeyDown}
          spellCheck={false}
          style={{
            fontFamily,
            fontSize: `${fontSize}${fontSizeUnit}`,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            outline: 'none',
          }}
          className="w-full min-h-[300px] text-base-content select-text transition-all duration-100 focus:outline-none"
        />

        {(!tabText || tabText.trim().length === 0) && !readOnly && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8 text-center text-base-content/40">
            <span className="text-4xl mb-2">🪈</span>
            <p className="font-semibold text-sm">A tablatura está vazia</p>
            <p className="text-xs max-w-sm mt-1">
              Use os botões de notas acima, o Seletor Visual de Furinhos, ou digite as letras (A-U)
              diretamente no teclado para compor sua música!
            </p>
          </div>
        )}
      </div>

      {/* Editor Footer / Info */}
      <div className="px-4 py-2 bg-base-200/40 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60 print:hidden font-mono">
        <div>
          <span>{tabText.split('\n').length} linhas</span> • <span>{tabText.length} caracteres</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Fonte: Modelo {fontVariant}</span> • <span>Tamanho: {fontSize}{fontSizeUnit}</span>
        </div>
      </div>
    </div>
  );
};
