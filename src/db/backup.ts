/**
 * Auto-backup system for protecting user data before destructive imports.
 * Stores up to MAX_BACKUPS snapshots in IndexedDB.
 */

import { db, type Backup } from './database';
import { exportToJson } from './import-export';

const MAX_BACKUPS = 3;

/**
 * Create a backup of all current data before a destructive operation.
 * Automatically prunes old backups beyond MAX_BACKUPS.
 */
export async function createBackup(reason: string): Promise<void> {
  const data = await exportToJson();

  await db.backups.add({
    createdAt: new Date(),
    reason,
    data,
  });

  await pruneBackups();
}

/**
 * Get list of backups (without the heavy data field).
 * Sorted by most recent first.
 */
export async function getBackups(): Promise<Omit<Backup, 'data'>[]> {
  const all = await db.backups.orderBy('createdAt').reverse().toArray();
  return all.map(({ id, createdAt, reason }) => ({ id, createdAt, reason }));
}

/**
 * Get a single backup's full data by ID.
 */
export async function getBackupData(id: number): Promise<string | null> {
  const backup = await db.backups.get(id);
  return backup?.data ?? null;
}

/**
 * Delete a specific backup.
 */
export async function deleteBackup(id: number): Promise<void> {
  await db.backups.delete(id);
}

/**
 * Keep only the MAX_BACKUPS most recent backups, delete the rest.
 */
async function pruneBackups(): Promise<void> {
  const all = await db.backups.orderBy('createdAt').reverse().toArray();
  if (all.length <= MAX_BACKUPS) return;

  const toDelete = all.slice(MAX_BACKUPS);
  await db.backups.bulkDelete(toDelete.map(b => b.id!));
}
