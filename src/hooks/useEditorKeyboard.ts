/**
 * Keyboard shortcuts for the schedule editor.
 * Handles: Ctrl+Z/Y (undo/redo), Escape (cancel all flows), Delete/Backspace (remove selected).
 */

import { useEffect, useCallback } from 'react';
import type { CellRef, LessonRef, LessonRequirement, Schedule } from '@/types';

export interface UseEditorKeyboardParams {
  selectedCells: CellRef[];
  schedule: Schedule;
  removeLessons: (refs: LessonRef[]) => void;
  clearSelectedCells: () => void;
  setSelectedLesson: (lesson: LessonRequirement | null) => void;
  setCopiedLesson: (lesson: null) => void;
  undo: () => void;
  redo: () => void;
  // Additional Escape handlers
  closeContextMenu: () => void;
  clearMovingLesson: () => void;
  closeMoveTargetPicker: () => void;
}

export interface UseEditorKeyboardReturn {
  /** Delete all lessons in selectedCells. Exposed for use in context menus. */
  handleDeleteSelected: () => void;
}

export function useEditorKeyboard(params: UseEditorKeyboardParams): UseEditorKeyboardReturn {
  const {
    selectedCells,
    schedule,
    removeLessons,
    clearSelectedCells,
    setSelectedLesson,
    setCopiedLesson,
    undo,
    redo,
    closeContextMenu,
    clearMovingLesson,
    closeMoveTargetPicker,
  } = params;

  const handleDeleteSelected = useCallback(() => {
    if (selectedCells.length === 0) return;

    const toDelete: LessonRef[] = [];
    for (const cell of selectedCells) {
      const lessons = schedule[cell.className]?.[cell.day]?.[cell.lessonNum]?.lessons ?? [];
      lessons.forEach((_, index) => {
        toDelete.push({
          className: cell.className,
          day: cell.day,
          lessonNum: cell.lessonNum,
          lessonIndex: index,
        });
      });
    }

    if (toDelete.length > 0) {
      removeLessons(toDelete);
      clearSelectedCells();
    }
  }, [selectedCells, schedule, removeLessons, clearSelectedCells]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      // Undo: Ctrl+Z (works even in inputs)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z (works even in inputs)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
        return;
      }

      if (isInputFocused) return;

      // Escape: clear selection and cancel all flows
      if (e.key === 'Escape') {
        setSelectedLesson(null);
        closeContextMenu();
        clearSelectedCells();
        setCopiedLesson(null);
        clearMovingLesson();
        closeMoveTargetPicker();
      }
      // Delete: remove all selected cells
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCells.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    setSelectedLesson,
    closeContextMenu,
    clearSelectedCells,
    setCopiedLesson,
    clearMovingLesson,
    closeMoveTargetPicker,
    selectedCells,
    handleDeleteSelected,
  ]);

  return { handleDeleteSelected };
}
