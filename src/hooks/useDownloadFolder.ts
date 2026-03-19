/**
 * Manages the user's preferred download folder for Telegram images.
 * Uses File System Access API with IDB persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { getStoredDownloadFolder, saveDownloadFolder } from '@/db/downloadFolder';

// File System Access API types (not yet in lib.dom.d.ts in all TS versions)
interface FileSystemHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission(desc: { mode: string }): Promise<PermissionState>;
  requestPermission(desc: { mode: string }): Promise<PermissionState>;
}
type WindowWithFSA = Window & {
  showDirectoryPicker(opts?: object): Promise<FileSystemDirectoryHandle>;
};

export const isFileSystemAccessSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export interface UseDownloadFolderReturn {
  /** Stored folder handle, or null if none set */
  folderHandle: FileSystemDirectoryHandle | null;
  /** Folder name for display (e.g. "Расписание") */
  folderName: string | null;
  /** True if File System Access API is available in this browser */
  isSupported: boolean;
  /** Pick a folder and save it as the new default */
  pickFolder: () => Promise<FileSystemDirectoryHandle | null>;
  /** Pick a folder once without changing the saved default */
  pickFolderOnce: () => Promise<FileSystemDirectoryHandle | null>;
  /**
   * Ensure readwrite permission on a stored handle.
   * Must be called inside a user gesture (click handler).
   * Returns the handle if permission granted, null if denied/cancelled.
   */
  ensurePermission: (handle: FileSystemDirectoryHandle) => Promise<FileSystemDirectoryHandle | null>;
}

export function useDownloadFolder(): UseDownloadFolderReturn {
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);

  // Load persisted handle on mount
  useEffect(() => {
    if (!isFileSystemAccessSupported) return;
    getStoredDownloadFolder().then(stored => {
      if (stored) setFolderHandle(stored.handle);
    });
  }, []);

  const pickFolder = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isFileSystemAccessSupported) return null;
    try {
      const handle = await (window as unknown as WindowWithFSA).showDirectoryPicker({ mode: 'readwrite' });
      await saveDownloadFolder(handle);
      setFolderHandle(handle);
      return handle;
    } catch {
      return null; // user cancelled or browser rejected
    }
  }, []);

  const pickFolderOnce = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isFileSystemAccessSupported) return null;
    try {
      return await (window as unknown as WindowWithFSA).showDirectoryPicker({ mode: 'readwrite' });
    } catch {
      return null;
    }
  }, []);

  const ensurePermission = useCallback(async (handle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | null> => {
    try {
      const h = handle as FileSystemHandleWithPermission;
      const perm = await h.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') return handle;
      const result = await h.requestPermission({ mode: 'readwrite' });
      return result === 'granted' ? handle : null;
    } catch {
      return null;
    }
  }, []);

  return {
    folderHandle,
    folderName: folderHandle?.name ?? null,
    isSupported: isFileSystemAccessSupported,
    pickFolder,
    pickFolderOnce,
    ensurePermission,
  };
}
