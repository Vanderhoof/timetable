/**
 * Редактор нагрузки — IndexedDB via Dexie
 *
 * Used alongside the zustand/localStorage store for data that can't be
 * JSON-serialized (FileSystemDirectoryHandle) or that may grow large enough
 * to warrant proper IDB storage in the future.
 *
 * DB version history:
 *   v1 — downloadFolders (singleton for the preferred save folder)
 */

import Dexie, { type EntityTable } from 'dexie';

/**
 * Per-button folder record.
 * З11-8: id is a string key (e.g. 'save', 'export', 'dept-file') instead of singleton 'default'.
 * FileSystemDirectoryHandle is structured-cloneable and can be stored in IDB directly.
 */
export interface StoredDownloadFolder {
  /** Key identifying which button this folder belongs to */
  id: string;
  handle: FileSystemDirectoryHandle;
  /** Snapshot of handle.name for display without async */
  folderName: string;
  savedAt: Date;
}

class WorkloadDatabase extends Dexie {
  downloadFolders!: EntityTable<StoredDownloadFolder, 'id'>;

  constructor() {
    super('rn-db');
    this.version(1).stores({
      downloadFolders: 'id',
    });
    // v2: widen id from literal 'default' to any string key (З11-8)
    this.version(2).stores({
      downloadFolders: 'id',
    });
  }
}

export const db = new WorkloadDatabase();
