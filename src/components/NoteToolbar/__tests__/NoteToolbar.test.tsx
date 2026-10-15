import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { NoteToolbar } from '../NoteToolbar';

describe('NoteToolbar Component', () => {
  const defaultProps = {
    ocarinaKey: 'C' as const,
    onKeyChange: vi.fn(),
    fontVariant: '1' as const,
    onFontVariantChange: vi.fn(),
    fontSize: 54,
    onFontSizeChange: vi.fn(),
    fontSizeUnit: 'px' as const,
    onFontSizeUnitChange: vi.fn(),
    onInsertChar: vi.fn(),
    soundEnabled: false,
    onToggleSound: vi.fn(),
    showMiniDiagrams: true,
    onToggleMiniDiagrams: vi.fn(),
  };

  it('renders sticky toolbar with note buttons', () => {
    const { container } = render(<NoteToolbar {...defaultProps} />);

    // Container should have sticky class
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('sticky');

    // Should render natural and accidental notes
    expect(screen.getByText('Notas Naturais:')).toBeInTheDocument();
    expect(screen.getByText('Acidentes (Sustenidos ♯ / Bemóis ♭):')).toBeInTheDocument();
  });

  it('calls onInsertChar when clicking a note button', () => {
    const onInsertChar = vi.fn();
    render(<NoteToolbar {...defaultProps} onInsertChar={onInsertChar} />);

    // Note C (key 'D') is in the natural notes row
    const noteC = screen.getByTitle(/C \(Tecla: D\)/i);
    fireEvent.click(noteC);

    expect(onInsertChar).toHaveBeenCalledWith('D');
  });

  it('renders Play button when not playing and handles clicks', { timeout: 15000 }, () => {
    const onTogglePlay = vi.fn();
    render(<NoteToolbar {...defaultProps} onTogglePlay={onTogglePlay} isPlaying={false} />);

    const playBtn = screen.getByRole('button', { name: /Tocar/i });
    expect(playBtn).toBeInTheDocument();
    fireEvent.click(playBtn);
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('renders Pause button when playing', { timeout: 15000 }, () => {
    render(<NoteToolbar {...defaultProps} onTogglePlay={vi.fn()} isPlaying={true} />);

    expect(screen.getByRole('button', { name: /Pausar/i })).toBeInTheDocument();
  });

  it('renders Delete Last Note button and calls onDeleteLastNote', () => {
    const onDeleteLastNote = vi.fn();
    render(
      <NoteToolbar
        {...defaultProps}
        onDeleteLastNote={onDeleteLastNote}
        canDeleteLastNote={true}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Apagar Nota/i });
    expect(deleteBtn).not.toBeDisabled();

    fireEvent.click(deleteBtn);
    expect(onDeleteLastNote).toHaveBeenCalledTimes(1);
  });

  it('disables Delete Last Note button when canDeleteLastNote is false', () => {
    render(
      <NoteToolbar
        {...defaultProps}
        onDeleteLastNote={vi.fn()}
        canDeleteLastNote={false}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Apagar Nota/i });
    expect(deleteBtn).toBeDisabled();
  });

  it('displays the last inserted note label and triggers preview', () => {
    const onPreviewLastNote = vi.fn();
    render(
      <NoteToolbar
        {...defaultProps}
        lastNoteLabel="E (Mi)"
        onPreviewLastNote={onPreviewLastNote}
      />
    );

    expect(screen.getByText('E (Mi)')).toBeInTheDocument();

    const previewBtn = screen.getByTitle(/Ouvir a última nota novamente/i);
    fireEvent.click(previewBtn);
    expect(onPreviewLastNote).toHaveBeenCalledTimes(1);
  });

  it('allows switching button scale (P, M, G)', () => {
    const onButtonScaleChange = vi.fn();
    render(
      <NoteToolbar
        {...defaultProps}
        buttonScale="md"
        onButtonScaleChange={onButtonScaleChange}
      />
    );

    const smallBtn = screen.getByTitle('Tamanho Médio-Compacto');
    const largeBtn = screen.getByTitle('Tamanho Extra Grande (Máxima legibilidade)');

    fireEvent.click(smallBtn);
    expect(onButtonScaleChange).toHaveBeenCalledWith('sm');

    fireEvent.click(largeBtn);
    expect(onButtonScaleChange).toHaveBeenCalledWith('lg');
  });
});
