/**
 * Persistence for the user's preferred download folder (File System Access API handle).
 * Stores a single 'telegram' record as a singleton.
 */

import { db } from './database';
import type { StoredDownloadFolder } from './database';

export async function getStoredDownloadFolder(): Promise<StoredDownloadFolder | null> {
  return (await db.downloadFolders.get('telegram')) ?? null;
}

export async function saveDownloadFolder(handle: FileSystemDirectoryHandle): Promise<void> {
  await db.downloadFolders.put({
    id: 'telegram',
    handle,
    folderName: handle.name,
    savedAt: new Date(),
  });
}

export async function clearDownloadFolder(): Promise<void> {
  await db.downloadFolders.delete('telegram');
}
