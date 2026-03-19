/**
 * Manages the user's preferred save folder for JSON backups.
 * Uses File System Access API with IDB persistence (survives page refresh).
 *
 * Falls back to classic blob download if the browser doesn't support
 * showDirectoryPicker (Safari, Firefox).
 */

import { useState, useEffect, useCallback } from 'react';
import { getStoredDownloadFolder, saveDownloadFolder } from '../db/downloadFolder';

interface FileSystemHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission(desc: { mode: string }): Promise<PermissionState>;
  requestPermission(desc: { mode: string }): Promise<PermissionState>;
}
type WindowWithFSA = Window & {
  showDirectoryPicker(opts?: object): Promise<FileSystemDirectoryHandle>;
};

export const isFileSystemAccessSupported =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export interface UseDownloadFolderReturn {
  folderHandle: FileSystemDirectoryHandle | null;
  folderName: string | null;
  isSupported: boolean;
  /** Pick a folder and save it as the new default */
  pickFolder: () => Promise<FileSystemDirectoryHandle | null>;
  /** Pick a folder once without changing the saved default */
  pickFolderOnce: () => Promise<FileSystemDirectoryHandle | null>;
  /** Verify readwrite permission on a stored handle (call inside a click handler) */
  ensurePermission: (handle: FileSystemDirectoryHandle) => Promise<FileSystemDirectoryHandle | null>;
}

// З11-8: each call site passes its own key so folders are stored independently
export function useDownloadFolder(key: string): UseDownloadFolderReturn {
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    if (!isFileSystemAccessSupported) return;
    getStoredDownloadFolder(key).then((stored) => {
      if (stored) setFolderHandle(stored.handle);
    });
  }, [key]);

  const pickFolder = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isFileSystemAccessSupported) return null;
    try {
      const handle = await (window as unknown as WindowWithFSA).showDirectoryPicker({ mode: 'readwrite' });
      await saveDownloadFolder(key, handle);
      setFolderHandle(handle);
      return handle;
    } catch {
      return null;
    }
  }, [key]);

  const pickFolderOnce = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isFileSystemAccessSupported) return null;
    try {
      return await (window as unknown as WindowWithFSA).showDirectoryPicker({ mode: 'readwrite' });
    } catch {
      return null;
    }
  }, []);

  const ensurePermission = useCallback(
    async (handle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | null> => {
      try {
        const h = handle as FileSystemHandleWithPermission;
        const perm = await h.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') return handle;
        const result = await h.requestPermission({ mode: 'readwrite' });
        return result === 'granted' ? handle : null;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    folderHandle,
    folderName: folderHandle?.name ?? null,
    isSupported: isFileSystemAccessSupported,
    pickFolder,
    pickFolderOnce,
    ensurePermission,
  };
}
