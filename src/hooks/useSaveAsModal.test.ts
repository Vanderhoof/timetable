/**
 * Tests for useSaveAsModal hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSaveAsModal } from './useSaveAsModal';

vi.mock('@/db', () => ({
  duplicateVersion: vi.fn(),
}));

import { duplicateVersion } from '@/db';

const createMouseEvent = () => ({ stopPropagation: vi.fn() } as unknown as React.MouseEvent);

describe('useSaveAsModal', () => {
  const loadVersions = vi.fn().mockResolvedValue(undefined);
  const params = { settingsDaysPerWeek: 5, loadVersions };

  beforeEach(() => {
    vi.clearAllMocks();
    (duplicateVersion as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('handleOpenSaveAs sets initial modal state', () => {
    const { result } = renderHook(() => useSaveAsModal(params));

    act(() => {
      result.current.handleOpenSaveAs('v-1', 'Шаблон 1', 'template', createMouseEvent());
    });

    expect(result.current.saveAsModalOpen).toBe(true);
    expect(result.current.saveAsName).toBe('Шаблон 1');
    expect(result.current.saveAsType).toBe('template');
    expect(result.current.saveAsDays).toBe(5);
  });

  it('handleSaveAs calls duplicateVersion and closes modal', async () => {
    const { result } = renderHook(() => useSaveAsModal(params));

    act(() => {
      result.current.handleOpenSaveAs('v-1', 'Техническое', 'technical', createMouseEvent());
    });

    await act(async () => {
      await result.current.handleSaveAs();
    });

    expect(duplicateVersion).toHaveBeenCalledWith('v-1', 'Техническое', 'technical', undefined, undefined, undefined);
    expect(result.current.saveAsModalOpen).toBe(false);
    expect(loadVersions).toHaveBeenCalledOnce();
  });

  it('handleSaveAs does not call duplicateVersion when name is empty for non-weekly', async () => {
    const { result } = renderHook(() => useSaveAsModal(params));

    act(() => {
      result.current.handleOpenSaveAs('v-1', '', 'technical', createMouseEvent());
    });

    await act(async () => {
      await result.current.handleSaveAs();
    });

    expect(duplicateVersion).not.toHaveBeenCalled();
  });

  it('closeSaveAsModal resets state', () => {
    const { result } = renderHook(() => useSaveAsModal(params));

    act(() => {
      result.current.handleOpenSaveAs('v-1', 'Test', 'template', createMouseEvent());
    });
    expect(result.current.saveAsModalOpen).toBe(true);

    act(() => result.current.closeSaveAsModal());
    expect(result.current.saveAsModalOpen).toBe(false);
  });
});
