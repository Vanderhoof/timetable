/**
 * Pure functions for building teacher and room schedule maps from a Schedule.
 * Used by ExportPage for the Teachers and Rooms grid views.
 */

import type { Schedule, Day, LessonNumber, ScheduledLesson } from '@/types';

/** A single lesson entry with its owning class name — used in teacher/room grid cells. */
export interface ScheduleEntry {
  className: string;
  lesson: ScheduledLesson;
}

export type ScheduleMap = Record<string, Record<Day, Record<LessonNumber, ScheduleEntry[]>>>;

/**
 * Builds a map keyed by teacher name → day → lessonNum → entries.
 * Lessons with a second teacher (teacher2) are indexed under both names.
 */
export function buildTeacherScheduleMap(schedule: Schedule): ScheduleMap {
  const result: ScheduleMap = {};

  for (const [className, days] of Object.entries(schedule)) {
    for (const [day, slots] of Object.entries(days)) {
      for (const [lessonNum, slot] of Object.entries(slots)) {
        const num = Number(lessonNum) as LessonNumber;
        const d = day as Day;

        for (const lesson of slot.lessons) {
          addEntry(result, lesson.teacher, className, d, num, lesson);
          if (lesson.teacher2) {
            addEntry(result, lesson.teacher2, className, d, num, lesson);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Builds a map keyed by room shortName → day → lessonNum → entries.
 */
export function buildRoomScheduleMap(schedule: Schedule): ScheduleMap {
  const result: ScheduleMap = {};

  for (const [className, days] of Object.entries(schedule)) {
    for (const [day, slots] of Object.entries(days)) {
      for (const [lessonNum, slot] of Object.entries(slots)) {
        const num = Number(lessonNum) as LessonNumber;
        const d = day as Day;

        for (const lesson of slot.lessons) {
          addEntry(result, lesson.room, className, d, num, lesson);
        }
      }
    }
  }

  return result;
}

function addEntry(
  map: ScheduleMap,
  key: string,
  className: string,
  day: Day,
  lessonNum: LessonNumber,
  lesson: ScheduledLesson
): void {
  if (!map[key]) map[key] = {} as ScheduleMap[string];
  if (!map[key][day]) map[key][day] = {} as Record<LessonNumber, ScheduleEntry[]>;
  if (!map[key][day][lessonNum]) map[key][day][lessonNum] = [];
  map[key][day][lessonNum].push({ className, lesson });
}
