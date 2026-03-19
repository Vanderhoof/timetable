/**
 * Partner availability exchange types
 * Used to share teacher busy slots between two scheduling units
 * Privacy: only teacher names + time slots, no class/subject content
 */

import type { Day, LessonNumber, VersionType } from './constants';

export interface PartnerAvailabilityFile {
  formatVersion: '1';
  exportedAt: string; // ISO timestamp
  versionType: VersionType;
  versionName: string; // e.g. "Неделя 03.03–07.03"
  mondayDate?: string; // ISO date, only for weekly
  /** key = teacher name, value = list of busy slots */
  slots: Record<string, Array<{ day: Day; lesson: LessonNumber }>>;
}
