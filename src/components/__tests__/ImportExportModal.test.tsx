import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImportExportModal } from '../ImportExportModal';

describe('ImportExportModal Component', () => {
  const defaultSong = {
    title: "Zelda's Lullaby",
    tabText: 'H - P - K - - -',
    ocarinaKey: 'C' as const,
    fontVariant: '1' as const,
    fontSize: 54,
    fontSizeUnit: 'px' as const,
    bpm: 100,
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ImportExportModal
        isOpen={false}
        onClose={vi.fn()}
        currentSong={defaultSong}
        onImportSong={vi.fn()}
        onSaveImage={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and tabs when isOpen is true', () => {
    render(
      <ImportExportModal
        isOpen={true}
        onClose={vi.fn()}
        currentSong={defaultSong}
        onImportSong={vi.fn()}
        onSaveImage={vi.fn()}
      />
    );

    expect(screen.getByText(/Importação & Exportação Universal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
  });

  it('shows export options on export tab', () => {
    render(
      <ImportExportModal
        isOpen={true}
        initialTab="export"
        onClose={vi.fn()}
        currentSong={defaultSong}
        onImportSong={vi.fn()}
        onSaveImage={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /ABC Notation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Pacote Ocarina/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Trilha MIDI/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Ac[uú]stico/i })).toBeInTheDocument();
  });

  it('detects ABC notation pasted into the import textarea', () => {
    render(
      <ImportExportModal
        isOpen={true}
        onClose={vi.fn()}
        currentSong={defaultSong}
        onImportSong={vi.fn()}
        onSaveImage={vi.fn()}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, {
      target: { value: 'X: 1\nT: Test Tune\nK: C\nc d e g' },
    });

    expect(screen.getByText(/🎼 ABC Notation/i)).toBeInTheDocument();
  });

  it('detects solfejo note text and applies to editor', () => {
    const onImportSong = vi.fn();
    render(
      <ImportExportModal
        isOpen={true}
        onClose={vi.fn()}
        currentSong={defaultSong}
        onImportSong={onImportSong}
        onSaveImage={vi.fn()}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, {
      target: { value: 'Dó Ré Mi Sol' },
    });

    expect(screen.getByText(/Solfejo Latino/i)).toBeInTheDocument();

    const applyBtn = screen.getByRole('button', { name: /aplicar tablatura no estúdio/i });
    fireEvent.click(applyBtn);

    expect(onImportSong).toHaveBeenCalledTimes(1);
    expect(onImportSong).toHaveBeenCalledWith(
      expect.objectContaining({
        ocarinaKey: 'C',
      })
    );
  });
});
