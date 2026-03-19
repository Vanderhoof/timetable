/**
 * Tests for useBackupList hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackupList } from './useBackupList';

// Mock DB modules
vi.mock('@/db/backup', () => ({
  getBackups: vi.fn(),
  getBackupData: vi.fn(),
  deleteBackup: vi.fn(),
}));
vi.mock('@/db/import-export', () => ({
  importFromJson: vi.fn(),
}));

import { getBackups, deleteBackup } from '@/db/backup';

describe('useBackupList', () => {
  const reloadData = vi.fn().mockResolvedValue(undefined);
  const loadVersions = vi.fn().mockResolvedValue(undefined);
  const setIsImporting = vi.fn();
  const setImportError = vi.fn();

  const params = { hasData: true, setIsImporting, setImportError, reloadData, loadVersions };

  beforeEach(() => {
    vi.clearAllMocks();
    (deleteBackup as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('loadBackups populates backups state', async () => {
    const fakeBackups = [
      { id: 1, reason: 'Test', createdAt: new Date() },
      { id: 2, reason: 'Test2', createdAt: new Date() },
    ];
    (getBackups as ReturnType<typeof vi.fn>).mockResolvedValue(fakeBackups);

    const { result } = renderHook(() => useBackupList(params));

    await act(async () => {
      await result.current.loadBackups();
    });

    expect(result.current.backups).toHaveLength(2);
  });

  it('toggleBackups toggles showBackups', () => {
    const { result } = renderHook(() => useBackupList(params));

    expect(result.current.showBackups).toBe(false);
    act(() => result.current.toggleBackups());
    expect(result.current.showBackups).toBe(true);
    act(() => result.current.toggleBackups());
    expect(result.current.showBackups).toBe(false);
  });

  it('handleDeleteBackup removes entry from list', async () => {
    (getBackups as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: 1, reason: 'A', createdAt: new Date() }])
      .mockResolvedValueOnce([]); // after delete

    const { result } = renderHook(() => useBackupList(params));

    await act(async () => { await result.current.loadBackups(); });
    expect(result.current.backups).toHaveLength(1);

    await act(async () => { await result.current.handleDeleteBackup(1); });

    expect(deleteBackup).toHaveBeenCalledWith(1);
    expect(result.current.backups).toHaveLength(0);
  });
});
