/**
 * "Save As" modal state and actions for StartPage.
 */

import { useState, useCallback } from 'react';
import type { VersionType } from '@/types';
import { duplicateVersion } from '@/db';

export interface UseSaveAsModalParams {
  settingsDaysPerWeek: number;
  loadVersions: () => Promise<void>;
}

export interface UseSaveAsModalReturn {
  saveAsModalOpen: boolean;
  saveAsSourceId: string | null;
  saveAsName: string;
  setSaveAsName: (name: string) => void;
  saveAsType: VersionType;
  setSaveAsType: (type: VersionType) => void;
  saveAsMondayDate: string;
  setSaveAsMondayDate: (date: string) => void;
  saveAsDays: number;
  setSaveAsDays: (days: number) => void;
  isSavingAs: boolean;
  handleOpenSaveAs: (versionId: string, currentName: string, sourceType: VersionType, e: React.MouseEvent) => void;
  handleSaveAs: () => Promise<void>;
  closeSaveAsModal: () => void;
}

export function useSaveAsModal(params: UseSaveAsModalParams): UseSaveAsModalReturn {
  const { settingsDaysPerWeek, loadVersions } = params;

  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [saveAsSourceId, setSaveAsSourceId] = useState<string | null>(null);
  const [saveAsName, setSaveAsName] = useState('');
  const [saveAsType, setSaveAsType] = useState<VersionType>('technical');
  const [saveAsMondayDate, setSaveAsMondayDate] = useState<string>('');
  const [saveAsDays, setSaveAsDays] = useState<number>(5);
  const [isSavingAs, setIsSavingAs] = useState(false);

  const handleOpenSaveAs = useCallback((
    versionId: string,
    currentName: string,
    sourceType: VersionType,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setSaveAsSourceId(versionId);
    setSaveAsName(currentName);
    setSaveAsType(sourceType);
    setSaveAsMondayDate('');
    setSaveAsDays(settingsDaysPerWeek);
    setSaveAsModalOpen(true);
  }, [settingsDaysPerWeek]);

  const handleSaveAs = useCallback(async () => {
    if (!saveAsSourceId) return;
    if (saveAsType === 'weekly') {
      if (!saveAsMondayDate) return;
    } else {
      if (!saveAsName.trim()) return;
    }

    setIsSavingAs(true);
    try {
      const name = saveAsName.trim() || (saveAsType === 'weekly' ? 'На неделю' : '');
      await duplicateVersion(
        saveAsSourceId,
        name,
        saveAsType,
        saveAsType === 'weekly' && saveAsMondayDate ? new Date(saveAsMondayDate) : undefined,
        undefined,
        saveAsType === 'weekly' ? saveAsDays : undefined,
      );
      await loadVersions();
      setSaveAsModalOpen(false);
      setSaveAsSourceId(null);
      setSaveAsName('');
      setSaveAsMondayDate('');
    } catch (error) {
      console.error('Failed to duplicate version:', error);
      alert('Ошибка при копировании');
    } finally {
      setIsSavingAs(false);
    }
  }, [saveAsSourceId, saveAsName, saveAsType, saveAsMondayDate, saveAsDays, loadVersions]);

  const closeSaveAsModal = useCallback(() => {
    setSaveAsModalOpen(false);
    setSaveAsSourceId(null);
    setSaveAsName('');
    setSaveAsMondayDate('');
  }, []);

  return {
    saveAsModalOpen,
    saveAsSourceId,
    saveAsName, setSaveAsName,
    saveAsType, setSaveAsType,
    saveAsMondayDate, setSaveAsMondayDate,
    saveAsDays, setSaveAsDays,
    isSavingAs,
    handleOpenSaveAs,
    handleSaveAs,
    closeSaveAsModal,
  };
}
