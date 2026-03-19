/**
 * Tests for useEditorKeyboard hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorKeyboard } from './useEditorKeyboard';
import type { CellRef, LessonRef, Schedule } from '@/types';

// Helper to fire a keyboard event
function fireKey(key: string, options: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
}

function makeSchedule(className = '5а'): Schedule {
  return {
    [className]: {
      'Пн': {
        1: { lessons: [{ id: 'l-1', requirementId: 'r-1', subject: 'Математика', teacher: 'Иванова Т.С.', room: '-114-' }] },
        2: { lessons: [] }, 3: { lessons: [] }, 4: { lessons: [] },
        5: { lessons: [] }, 6: { lessons: [] }, 7: { lessons: [] }, 8: { lessons: [] },
      },
    },
  };
}

describe('useEditorKeyboard', () => {
  const removeLessons = vi.fn();
  const clearSelectedCells = vi.fn();
  const setSelectedLesson = vi.fn();
  const setCopiedLesson = vi.fn();
  const undo = vi.fn();
  const redo = vi.fn();
  const closeContextMenu = vi.fn();
  const clearMovingLesson = vi.fn();
  const closeMoveTargetPicker = vi.fn();

  const baseParams = {
    selectedCells: [] as CellRef[],
    schedule: {} as Schedule,
    removeLessons,
    clearSelectedCells,
    setSelectedLesson,
    setCopiedLesson,
    undo,
    redo,
    closeContextMenu,
    clearMovingLesson,
    closeMoveTargetPicker,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Ctrl+Z triggers undo', () => {
    renderHook(() => useEditorKeyboard(baseParams));
    fireKey('z', { ctrlKey: true });
    expect(undo).toHaveBeenCalledOnce();
  });

  it('Ctrl+Y triggers redo', () => {
    renderHook(() => useEditorKeyboard(baseParams));
    fireKey('y', { ctrlKey: true });
    expect(redo).toHaveBeenCalledOnce();
  });

  it('Ctrl+Shift+Z triggers redo', () => {
    renderHook(() => useEditorKeyboard(baseParams));
    fireKey('z', { ctrlKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledOnce();
  });

  it('Escape clears selection, lesson, copied lesson, moving lesson, context menu', () => {
    renderHook(() => useEditorKeyboard(baseParams));
    fireKey('Escape');
    expect(setSelectedLesson).toHaveBeenCalledWith(null);
    expect(clearSelectedCells).toHaveBeenCalledOnce();
    expect(setCopiedLesson).toHaveBeenCalledWith(null);
    expect(clearMovingLesson).toHaveBeenCalledOnce();
    expect(closeContextMenu).toHaveBeenCalledOnce();
    expect(closeMoveTargetPicker).toHaveBeenCalledOnce();
  });

  it('Delete with no selectedCells does nothing', () => {
    renderHook(() => useEditorKeyboard({ ...baseParams, selectedCells: [] }));
    fireKey('Delete');
    expect(removeLessons).not.toHaveBeenCalled();
  });

  it('Delete with selectedCells removes all lessons in selected cells', () => {
    const schedule = makeSchedule('5а');
    const selectedCells: CellRef[] = [{ className: '5а', day: 'Пн', lessonNum: 1 }];
    renderHook(() => useEditorKeyboard({ ...baseParams, selectedCells, schedule }));
    fireKey('Delete');
    expect(removeLessons).toHaveBeenCalledOnce();
    const refs = removeLessons.mock.calls[0][0] as LessonRef[];
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ className: '5а', day: 'Пн', lessonNum: 1, lessonIndex: 0 });
    expect(clearSelectedCells).toHaveBeenCalledOnce();
  });

  it('Backspace works the same as Delete', () => {
    const schedule = makeSchedule('5а');
    const selectedCells: CellRef[] = [{ className: '5а', day: 'Пн', lessonNum: 1 }];
    renderHook(() => useEditorKeyboard({ ...baseParams, selectedCells, schedule }));
    fireKey('Backspace');
    expect(removeLessons).toHaveBeenCalledOnce();
  });

  it('Ctrl+Z works even when an input element is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useEditorKeyboard(baseParams));
    fireKey('z', { ctrlKey: true });
    expect(undo).toHaveBeenCalledOnce();

    document.body.removeChild(input);
  });

  it('Escape does NOT fire when input is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useEditorKeyboard(baseParams));
    fireKey('Escape');
    expect(setSelectedLesson).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
