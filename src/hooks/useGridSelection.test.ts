/**
 * Tests for useGridSelection hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridSelection } from './useGridSelection';

describe('useGridSelection', () => {
  it('initial state: selection is null, isSelecting is false', () => {
    const { result } = renderHook(() => useGridSelection());
    expect(result.current.selection).toBeNull();
    expect(result.current.isSelecting).toBe(false);
  });

  it('handleGridMouseDown starts selection at clicked cell', () => {
    const { result } = renderHook(() => useGridSelection());

    act(() => result.current.handleGridMouseDown(2, 3));

    expect(result.current.isSelecting).toBe(true);
    expect(result.current.selection).toEqual({ startRow: 2, startCol: 3, endRow: 2, endCol: 3 });
  });

  it('handleGridMouseMove extends selection while selecting', () => {
    const { result } = renderHook(() => useGridSelection());

    act(() => result.current.handleGridMouseDown(0, 0));
    act(() => result.current.handleGridMouseMove(3, 4));

    expect(result.current.selection).toEqual({ startRow: 0, startCol: 0, endRow: 3, endCol: 4 });
  });

  it('handleGridMouseMove does nothing when not selecting', () => {
    const { result } = renderHook(() => useGridSelection());

    act(() => result.current.handleGridMouseMove(3, 4));

    expect(result.current.selection).toBeNull();
  });

  it('handleGridMouseUp stops selecting', () => {
    const { result } = renderHook(() => useGridSelection());

    act(() => result.current.handleGridMouseDown(0, 0));
    expect(result.current.isSelecting).toBe(true);

    act(() => result.current.handleGridMouseUp());
    expect(result.current.isSelecting).toBe(false);
    // selection remains after mouse up (for copy)
    expect(result.current.selection).not.toBeNull();
  });

  it('clearSelection resets selection to null', () => {
    const { result } = renderHook(() => useGridSelection());

    act(() => result.current.handleGridMouseDown(1, 1));
    expect(result.current.selection).not.toBeNull();

    act(() => result.current.clearSelection());
    expect(result.current.selection).toBeNull();
  });

  it('isInSelection: forward drag (top-left to bottom-right)', () => {
    const { result } = renderHook(() => useGridSelection());

    act(() => result.current.handleGridMouseDown(1, 2));
    act(() => result.current.handleGridMouseMove(3, 4));

    expect(result.current.isInSelection(1, 2)).toBe(true);
    expect(result.current.isInSelection(2, 3)).toBe(true);
    expect(result.current.isInSelection(3, 4)).toBe(true);
    expect(result.current.isInSelection(0, 2)).toBe(false);
    expect(result.current.isInSelection(1, 1)).toBe(false);
    expect(result.current.isInSelection(4, 4)).toBe(false);
  });

  it('isInSelection: reverse drag (bottom-right to top-left)', () => {
    const { result } = renderHook(() => useGridSelection());

    act(() => result.current.handleGridMouseDown(3, 4));
    act(() => result.current.handleGridMouseMove(1, 2));

    // Should still cover rows 1-3, cols 2-4 regardless of drag direction
    expect(result.current.isInSelection(1, 2)).toBe(true);
    expect(result.current.isInSelection(2, 3)).toBe(true);
    expect(result.current.isInSelection(3, 4)).toBe(true);
    expect(result.current.isInSelection(0, 2)).toBe(false);
    expect(result.current.isInSelection(1, 1)).toBe(false);
  });

  it('isInSelection returns false when selection is null', () => {
    const { result } = renderHook(() => useGridSelection());

    expect(result.current.isInSelection(0, 0)).toBe(false);
  });
});
