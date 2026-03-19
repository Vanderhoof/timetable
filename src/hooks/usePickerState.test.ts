import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePickerState } from './usePickerState';

describe('usePickerState', () => {
  it('starts closed with null data', () => {
    const { result } = renderHook(() => usePickerState<{ day: string }>());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('open() sets data and isOpen', async () => {
    const { result } = renderHook(() => usePickerState<{ day: string }>());
    await act(async () => { result.current.open({ day: 'Mon' }); });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual({ day: 'Mon' });
  });

  it('close() clears data and isOpen', async () => {
    const { result } = renderHook(() => usePickerState<{ day: string }>());
    await act(async () => { result.current.open({ day: 'Mon' }); });
    await act(async () => { result.current.close(); });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('open() with new data updates data', async () => {
    const { result } = renderHook(() => usePickerState<{ day: string }>());
    await act(async () => { result.current.open({ day: 'Mon' }); });
    await act(async () => { result.current.open({ day: 'Tue' }); });
    expect(result.current.data).toEqual({ day: 'Tue' });
  });

  it('open and close are stable references', () => {
    const { result, rerender } = renderHook(() => usePickerState<{ day: string }>());
    const openRef = result.current.open;
    const closeRef = result.current.close;
    rerender();
    expect(result.current.open).toBe(openRef);
    expect(result.current.close).toBe(closeRef);
  });

  it('returned object is stable when data does not change', () => {
    const { result, rerender } = renderHook(() => usePickerState<{ day: string }>());
    const ref1 = result.current;
    rerender();
    expect(result.current).toBe(ref1);
  });

  it('returned object reference changes on open()', async () => {
    const { result } = renderHook(() => usePickerState<{ day: string }>());
    const ref1 = result.current;
    await act(async () => { result.current.open({ day: 'Mon' }); });
    expect(result.current).not.toBe(ref1);
  });
});
