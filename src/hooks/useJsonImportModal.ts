/**
 * JSON import modal state and actions for StartPage.
 */

import { useState, useCallback } from 'react';
import { pickJsonFile, importFromJson, parseExportData, getExportSummary } from '@/db/import-export';
import { createBackup } from '@/db/backup';
import type { ExportSummary } from '@/db/import-export';

export interface UseJsonImportModalParams {
  hasData: boolean;
  setIsImporting: (loading: boolean) => void;
  setImportError: (err: string | null) => void;
  reloadData: () => Promise<void>;
  loadVersions: () => Promise<void>;
  loadBackups: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export interface UseJsonImportModalReturn {
  importModalOpen: boolean;
  importSummary: ExportSummary | null;
  pendingImportJson: string | null;
  handleImportJsonStart: () => Promise<void>;
  handleImportJsonConfirm: () => Promise<void>;
  closeImportModal: () => void;
}

export function useJsonImportModal(params: UseJsonImportModalParams): UseJsonImportModalReturn {
  const { hasData, setIsImporting, setImportError, reloadData, loadVersions, loadBackups, showToast } = params;

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<ExportSummary | null>(null);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);

  const handleImportJsonStart = useCallback(async () => {
    setImportError(null);
    const file = await pickJsonFile();
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseExportData(text);
      const summary = getExportSummary(data);
      setPendingImportJson(text);
      setImportSummary(summary);
      setImportModalOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка чтения файла';
      setImportError(msg);
      showToast(msg, 'error');
    }
  }, [setImportError, showToast]);

  const handleImportJsonConfirm = useCallback(async () => {
    if (!pendingImportJson) return;

    setIsImporting(true);
    try {
      if (hasData) {
        await createBackup('Импорт JSON');
      }
      await importFromJson(pendingImportJson);
      await reloadData();
      await loadVersions();
      await loadBackups();
      setImportModalOpen(false);
      setPendingImportJson(null);
      setImportSummary(null);
      showToast('Данные загружены', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка импорта';
      setImportError(msg);
      showToast(msg, 'error');
    } finally {
      setIsImporting(false);
    }
  }, [pendingImportJson, hasData, setIsImporting, setImportError, reloadData, loadVersions, loadBackups, showToast]);

  const closeImportModal = useCallback(() => {
    setImportModalOpen(false);
    setPendingImportJson(null);
    setImportSummary(null);
  }, []);

  return {
    importModalOpen,
    importSummary,
    pendingImportJson,
    handleImportJsonStart,
    handleImportJsonConfirm,
    closeImportModal,
  };
}
