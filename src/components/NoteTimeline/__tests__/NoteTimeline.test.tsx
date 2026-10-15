import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { NoteTimeline } from '../NoteTimeline';

describe('NoteTimeline Component', () => {
  it('renders empty state when tab is empty', () => {
    render(
      <NoteTimeline
        tabText=""
        onTabTextChange={vi.fn()}
        ocarinaKey="C"
        soundEnabled={false}
        bpm={100}
      />
    );

    expect(screen.getByText('Nenhuma nota adicionada ainda')).toBeInTheDocument();
  });

  it('renders note cards for parsed notes in the tab', () => {
    const tabText = 'H - P - K - - -';
    render(
      <NoteTimeline
        tabText={tabText}
        onTabTextChange={vi.fn()}
        ocarinaKey="C"
        soundEnabled={false}
        bpm={100}
      />
    );

    // Should display count of notes (3 notas)
    expect(screen.getByText(/3 notas/i)).toBeInTheDocument();

    // Notes #1, #2, #3 badges
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();

    // Note pitch labels (H = E, P = C², K = G)
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('C²')).toBeInTheDocument();
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('calls onTabTextChange with updated duration when clicking a preset duration button', () => {
    const tabText = 'H - P - K';
    const onTabTextChange = vi.fn();

    render(
      <NoteTimeline
        tabText={tabText}
        onTabTextChange={onTabTextChange}
        ocarinaKey="C"
        soundEnabled={false}
        bpm={100}
      />
    );

    // Find all '4t' buttons and click the first one (for note H)
    const fourBeatButtons = screen.getAllByRole('button', { name: /4t/i });
    expect(fourBeatButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(fourBeatButtons[0]);

    // Should update note H from 2 beats to 4 beats ('H - - - P - K')
    expect(onTabTextChange).toHaveBeenCalledWith('H - - - P - K');
  });

  it('calls onTabTextChange when increasing duration with the + button', () => {
    const tabText = 'D'; // 1 beat
    const onTabTextChange = vi.fn();

    render(
      <NoteTimeline
        tabText={tabText}
        onTabTextChange={onTabTextChange}
        ocarinaKey="C"
        soundEnabled={false}
        bpm={100}
      />
    );

    const plusButton = screen.getByTitle(/Aumentar 1 tempo/i);
    fireEvent.click(plusButton);

    // 1 beat + 1 = 2 beats ('D -')
    expect(onTabTextChange).toHaveBeenCalledWith('D -');
  });

  it('calls onTabTextChange when clicking delete button for a note', () => {
    const tabText = 'D F H';
    const onTabTextChange = vi.fn();

    render(
      <NoteTimeline
        tabText={tabText}
        onTabTextChange={onTabTextChange}
        ocarinaKey="C"
        soundEnabled={false}
        bpm={100}
      />
    );

    const deleteButtons = screen.getAllByTitle(/Remover esta nota/i);
    expect(deleteButtons).toHaveLength(3);

    // Delete note D (first note)
    fireEvent.click(deleteButtons[0]);
    expect(onTabTextChange).toHaveBeenCalledWith('F H');
  });

  it('highlights the active note when activePlaybackIndex matches', () => {
    const tabText = 'D F H';
    const { container } = render(
      <NoteTimeline
        tabText={tabText}
        onTabTextChange={vi.fn()}
        ocarinaKey="C"
        soundEnabled={false}
        bpm={100}
        activePlaybackIndex={1} // second note (F)
      />
    );

    // The second card should have ring and active classes
    const cards = container.querySelectorAll('.flex-shrink-0');
    expect(cards[1].className).toContain('ring-4');
  });
});
