/**
 * CRUD operations for past academic year snapshots
 */

import { db } from './database';
import type { YearSnapshot } from './database';

/**
 * Get all year snapshots ordered by creation date descending (newest first)
 */
export async function getYearSnapshots(): Promise<YearSnapshot[]> {
  const snapshots = await db.yearSnapshots.orderBy('createdAt').toArray();
  return snapshots.reverse();
}

/**
 * Save a new year snapshot
 */
export async function addYearSnapshot(yearLabel: string, data: string): Promise<number> {
  const id = await db.yearSnapshots.add({ yearLabel, data, createdAt: new Date() });
  return id as number;
}

/**
 * Delete a year snapshot by id
 */
export async function deleteYearSnapshot(id: number): Promise<void> {
  await db.yearSnapshots.delete(id);
}
