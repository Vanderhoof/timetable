/**
 * Test helpers for loading real-data fixture.
 */

import rawData from './real-data.json';
import { parseExportData } from '@/db/import-export';
import type { ExportData } from '@/db/import-export';
import type { Teacher, Room, LessonRequirement, SchoolClass, Group, Schedule } from '@/types';

let parsed: ExportData | null = null;

/** Parse the fixture once and cache it */
export function getRealData(): ExportData {
  if (!parsed) {
    parsed = parseExportData(JSON.stringify(rawData));
  }
  return parsed;
}

/** Build teacher lookup (name -> Teacher) */
export function buildTeacherMap(teachers: Teacher[]): Record<string, Teacher> {
  const map: Record<string, Teacher> = {};
  for (const t of teachers) map[t.name] = t;
  return map;
}

/** Build room lookup (shortName -> Room) */
export function buildRoomMap(rooms: Room[]): Record<string, Room> {
  const map: Record<string, Room> = {};
  for (const r of rooms) map[r.shortName] = r;
  return map;
}

/** Get the template schedule (largest, name "2025") */
export function getTemplateSchedule(): Schedule {
  const data = getRealData();
  const version = data.scheduleVersions.find(v => v.name === '2025');
  if (!version) throw new Error('Template version "2025" not found');
  return version.schedule;
}

/** Get the weekly schedule (name "Недельная", has temporaryLessons) */
export function getWeeklyVersion() {
  const data = getRealData();
  const version = data.scheduleVersions.find(v => v.name === 'Недельная');
  if (!version) throw new Error('Weekly version "Недельная" not found');
  return version;
}

/** Convenience: get all requirements */
export function getRequirements(): LessonRequirement[] {
  return getRealData().lessonRequirements;
}

/** Convenience: get all classes */
export function getClasses(): SchoolClass[] {
  return getRealData().classes;
}

/** Convenience: get all groups */
export function getGroups(): Group[] {
  return getRealData().groups;
}
