/**
 * Partner files persistence layer
 * Stores the singleton partner availability file in IndexedDB
 */

import { db } from './database';

/**
 * Get the stored partner file JSON, or null if none saved
 */
export async function getPartnerFileJson(): Promise<string | null> {
  const record = await db.partnerFiles.get('current');
  return record?.json ?? null;
}

/**
 * Save (upsert) partner file JSON with id='current'
 */
export async function savePartnerFileToDB(json: string): Promise<void> {
  await db.partnerFiles.put({ id: 'current', json, importedAt: new Date() });
}

/**
 * Remove the stored partner file
 */
export async function clearPartnerFileFromDB(): Promise<void> {
  await db.partnerFiles.delete('current');
}
