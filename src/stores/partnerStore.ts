/**
 * Partner Store — tracks partner availability data in memory
 * Persists the raw JSON to IndexedDB, rebuilds lookup Set on load
 */

import { create } from 'zustand';
import type { Day, LessonNumber } from '@/types';
import type { PartnerAvailabilityFile } from '@/types/partner';
import {
  parsePartnerFile,
  computeMatchedTeachers,
  buildPartnerBusySet,
} from '@/logic/partner';
import {
  getPartnerFileJson,
  savePartnerFileToDB,
  clearPartnerFileFromDB,
} from '@/db/partnerFiles';

interface PartnerState {
  partnerData: PartnerAvailabilityFile | null;
  matchedTeachers: Set<string>;
  partnerBusySet: Set<string>;

  /**
   * Load + validate a partner JSON string, build the busy set, persist to IDB.
   * Throws a user-friendly error string if the JSON is invalid.
   */
  loadPartnerFile: (json: string, ourTeacherNames: string[]) => Promise<void>;

  /** Clear partner data from memory and IDB */
  clearPartnerFile: () => Promise<void>;

  /**
   * Re-load partner data from IDB on app start.
   * Must be called after teacher names are available.
   */
  initFromDb: (ourTeacherNames: string[]) => Promise<void>;

  /** O(1) check whether a teacher is busy at a given slot per the partner data */
  isPartnerBusy: (teacher: string, day: Day, lesson: LessonNumber) => boolean;
}

export const usePartnerStore = create<PartnerState>((set, get) => ({
  partnerData: null,
  matchedTeachers: new Set(),
  partnerBusySet: new Set(),

  loadPartnerFile: async (json, ourTeacherNames) => {
    // parsePartnerFile throws user-friendly Error on invalid input
    const parsed = parsePartnerFile(json);
    const matchedTeachers = computeMatchedTeachers(parsed.slots, ourTeacherNames);
    const partnerBusySet = buildPartnerBusySet(parsed, matchedTeachers);

    await savePartnerFileToDB(json);
    set({ partnerData: parsed, matchedTeachers, partnerBusySet });
  },

  clearPartnerFile: async () => {
    await clearPartnerFileFromDB();
    set({ partnerData: null, matchedTeachers: new Set(), partnerBusySet: new Set() });
  },

  initFromDb: async (ourTeacherNames) => {
    const json = await getPartnerFileJson();
    if (!json) return; // nothing saved — stay null

    try {
      const parsed = parsePartnerFile(json);
      const matchedTeachers = computeMatchedTeachers(parsed.slots, ourTeacherNames);
      const partnerBusySet = buildPartnerBusySet(parsed, matchedTeachers);
      set({ partnerData: parsed, matchedTeachers, partnerBusySet });
    } catch {
      // Saved file is corrupt or from incompatible version — ignore silently
    }
  },

  isPartnerBusy: (teacher, day, lesson) => {
    return get().partnerBusySet.has(`${teacher}|${day}|${lesson}`);
  },
}));
