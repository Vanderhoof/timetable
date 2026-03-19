/**
 * Tests for useJsonImportModal hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJsonImportModal } from './useJsonImportModal';

vi.mock('@/db/import-export', () => ({
  pickJsonFile: vi.fn(),
  importFromJson: vi.fn(),
  parseExportData: vi.fn(),
  getExportSummary: vi.fn(),
}));
vi.mock('@/db/backup', () => ({
  createBackup: vi.fn(),
}));

import { pickJsonFile, importFromJson, parseExportData, getExportSummary } from '@/db/import-export';

const makeFakeFile = (text: string) => ({
  text: () => Promise.resolve(text),
}) as unknown as File;

describe('useJsonImportModal', () => {
  const reloadData = vi.fn().mockResolvedValue(undefined);
  const loadVersions = vi.fn().mockResolvedValue(undefined);
  const loadBackups = vi.fn().mockResolvedValue(undefined);
  const setIsImporting = vi.fn();
  const setImportError = vi.fn();

  const showToast = vi.fn();
  const params = { hasData: true, setIsImporting, setImportError, reloadData, loadVersions, loadBackups, showToast };

  beforeEach(() => {
    vi.clearAllMocks();
    (importFromJson as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('handleImportJsonStart sets preview and opens modal', async () => {
    const fakeData = { teachers: [] };
    const fakeSummary = { teacherCount: 0, roomCount: 0, classCount: 0 };

    (pickJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue(makeFakeFile('{"json":"data"}'));
    (parseExportData as ReturnType<typeof vi.fn>).mockReturnValue(fakeData);
    (getExportSummary as ReturnType<typeof vi.fn>).mockReturnValue(fakeSummary);

    const { result } = renderHook(() => useJsonImportModal(params));

    await act(async () => {
      await result.current.handleImportJsonStart();
    });

    expect(result.current.importModalOpen).toBe(true);
    expect(result.current.importSummary).toEqual(fakeSummary);
    expect(result.current.pendingImportJson).toBe('{"json":"data"}');
  });

  it('handleImportJsonStart does nothing when no file picked', async () => {
    (pickJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { result } = renderHook(() => useJsonImportModal(params));

    await act(async () => {
      await result.current.handleImportJsonStart();
    });

    expect(result.current.importModalOpen).toBe(false);
  });

  it('handleImportJsonConfirm calls importFromJson and closes modal', async () => {
    (pickJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue(makeFakeFile('{"valid":"json"}'));
    (parseExportData as ReturnType<typeof vi.fn>).mockReturnValue({});
    (getExportSummary as ReturnType<typeof vi.fn>).mockReturnValue({});

    const { result } = renderHook(() => useJsonImportModal(params));

    await act(async () => { await result.current.handleImportJsonStart(); });
    await act(async () => { await result.current.handleImportJsonConfirm(); });

    expect(importFromJson).toHaveBeenCalledWith('{"valid":"json"}');
    expect(result.current.importModalOpen).toBe(false);
    expect(result.current.pendingImportJson).toBeNull();
    expect(reloadData).toHaveBeenCalledOnce();
    expect(loadVersions).toHaveBeenCalledOnce();
    expect(loadBackups).toHaveBeenCalledOnce();
  });

  it('closeImportModal resets state', async () => {
    (pickJsonFile as ReturnType<typeof vi.fn>).mockResolvedValue(makeFakeFile('{}'));
    (parseExportData as ReturnType<typeof vi.fn>).mockReturnValue({});
    (getExportSummary as ReturnType<typeof vi.fn>).mockReturnValue({});

    const { result } = renderHook(() => useJsonImportModal(params));
    await act(async () => { await result.current.handleImportJsonStart(); });
    expect(result.current.importModalOpen).toBe(true);

    act(() => result.current.closeImportModal());

    expect(result.current.importModalOpen).toBe(false);
    expect(result.current.pendingImportJson).toBeNull();
    expect(result.current.importSummary).toBeNull();
  });
});
