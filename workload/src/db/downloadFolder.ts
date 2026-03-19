/**
 * Persistence for the user's preferred save folders.
 * Wraps the downloadFolders IDB table with a simple keyed get/save/clear API.
 *
 * З11-8: Each button gets its own key ('save', 'export', 'dept-file').
 */

import { db } from './database';
import type { StoredDownloadFolder } from './database';

export async function getStoredDownloadFolder(key: string): Promise<StoredDownloadFolder | null> {
  return (await db.downloadFolders.get(key)) ?? null;
}

export async function saveDownloadFolder(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  await db.downloadFolders.put({
    id: key,
    handle,
    folderName: handle.name,
    savedAt: new Date(),
  });
}

export async function clearDownloadFolder(key: string): Promise<void> {
  await db.downloadFolders.delete(key);
}
