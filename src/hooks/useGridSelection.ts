/**
 * useGridSelection — drag-select state for ExportPage grid
 */

import { useState, useCallback } from 'react';

export interface GridSelection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface UseGridSelectionReturn {
  selection: GridSelection | null;
  isSelecting: boolean;
  isInSelection: (rowIndex: number, colIndex: number) => boolean;
  handleGridMouseDown: (rowIndex: number, colIndex: number) => void;
  handleGridMouseMove: (rowIndex: number, colIndex: number) => void;
  handleGridMouseUp: () => void;
  clearSelection: () => void;
}

export function useGridSelection(): UseGridSelectionReturn {
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const isInSelection = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!selection) return false;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  }, [selection]);

  const handleGridMouseDown = useCallback((rowIndex: number, colIndex: number) => {
    setIsSelecting(true);
    setSelection({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
  }, []);

  const handleGridMouseMove = useCallback((rowIndex: number, colIndex: number) => {
    if (!isSelecting) return;
    setSelection(prev => prev ? { ...prev, endRow: rowIndex, endCol: colIndex } : null);
  }, [isSelecting]);

  const handleGridMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    isSelecting,
    isInSelection,
    handleGridMouseDown,
    handleGridMouseMove,
    handleGridMouseUp,
    clearSelection,
  };
}
