import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormSave } from './useFormSave';

describe('useFormSave', () => {
  it('isNew is true when item is null', () => {
    const { result } = renderHook(() => useFormSave(null, vi.fn()));
    expect(result.current.isNew).toBe(true);
  });

  it('isNew is true when item is undefined', () => {
    const { result } = renderHook(() => useFormSave(undefined, vi.fn()));
    expect(result.current.isNew).toBe(true);
  });

  it('isNew is false when item exists', () => {
    const { result } = renderHook(() => useFormSave({ id: 'abc' }, vi.fn()));
    expect(result.current.isNew).toBe(false);
  });

  it('isSaving starts as false', () => {
    const { result } = renderHook(() => useFormSave(null, vi.fn()));
    expect(result.current.isSaving).toBe(false);
  });

  it('calls fn and onClose on success', async () => {
    const onClose = vi.fn();
    const fn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useFormSave(null, onClose));

    await act(async () => {
      await result.current.save(fn);
    });

    expect(fn).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onError but not onClose on failure', async () => {
    const onClose = vi.fn();
    const onError = vi.fn();
    const error = new Error('DUPLICATE_NAME');
    const fn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useFormSave(null, onClose));

    await act(async () => {
      await result.current.save(fn, onError);
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('resets isSaving to false after success', async () => {
    const { result } = renderHook(() => useFormSave(null, vi.fn()));

    await act(async () => {
      await result.current.save(async () => {});
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('resets isSaving to false after error', async () => {
    const { result } = renderHook(() => useFormSave(null, vi.fn()));

    await act(async () => {
      await result.current.save(async () => { throw new Error('fail'); }, vi.fn());
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('does not call onError when no onError passed and fn throws', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useFormSave(null, onClose));

    // Should not throw even if no onError provided
    await act(async () => {
      await result.current.save(async () => { throw new Error('silent'); });
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });
});
