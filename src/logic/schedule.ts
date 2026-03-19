/**
 * Schedule manipulation functions
 * Pure functions - no side effects, no React, no DOM
 */

import type {
  Schedule,
  ClassSchedule,
  ScheduleSlot,
  ScheduledLesson,
  Day,
  LessonNumber,
} from '@/types';
import { DAYS, LESSON_NUMBERS } from '@/types';

/**
 * Get lessons from a specific slot (always returns array, never undefined)
 */
export function getSlotLessons(
  schedule: Schedule,
  className: string,
  day: Day,
  lessonNum: LessonNumber
): ScheduledLesson[] {
  return schedule[className]?.[day]?.[lessonNum]?.lessons ?? [];
}

/**
 * Check if a slot has any lessons
 */
export function isSlotOccupied(
  schedule: Schedule,
  className: string,
  day: Day,
  lessonNum: LessonNumber
): boolean {
  return getSlotLessons(schedule, className, day, lessonNum).length > 0;
}

/**
 * Get a specific lesson from a slot by index
 */
export function getLessonAt(
  schedule: Schedule,
  className: string,
  day: Day,
  lessonNum: LessonNumber,
  index: number
): ScheduledLesson | undefined {
  const lessons = getSlotLessons(schedule, className, day, lessonNum);
  return lessons[index];
}

/**
 * Create an empty schedule slot
 */
export function createEmptySlot(): ScheduleSlot {
  return { lessons: [] };
}

/**
 * Create an empty day schedule with all slots initialized
 */
export function createEmptyDaySchedule(lessonNumbers: readonly LessonNumber[]): Record<LessonNumber, ScheduleSlot> {
  const daySchedule: Partial<Record<LessonNumber, ScheduleSlot>> = {};
  for (const num of lessonNumbers) {
    daySchedule[num] = createEmptySlot();
  }
  return daySchedule as Record<LessonNumber, ScheduleSlot>;
}

/**
 * Create an empty class schedule with all days and slots initialized
 */
export function createEmptyClassSchedule(
  days: readonly Day[],
  lessonNumbers: readonly LessonNumber[]
): ClassSchedule {
  const classSchedule: ClassSchedule = {};
  for (const day of days) {
    classSchedule[day] = createEmptyDaySchedule(lessonNumbers);
  }
  return classSchedule;
}

/**
 * Create an empty schedule for multiple classes
 */
export function createEmptySchedule(
  classNames: string[],
  days: readonly Day[],
  lessonNumbers: readonly LessonNumber[]
): Schedule {
  const schedule: Schedule = {};
  for (const className of classNames) {
    schedule[className] = createEmptyClassSchedule(days, lessonNumbers);
  }
  return schedule;
}

/**
 * Normalize a schedule to ensure all slots exist
 * Fills in missing days and lesson numbers with empty slots
 */
export function normalizeSchedule(
  schedule: Schedule,
  days: readonly Day[],
  lessonNumbers: readonly LessonNumber[]
): Schedule {
  const normalized: Schedule = {};

  for (const className of Object.keys(schedule)) {
    normalized[className] = {};
    const classSchedule = schedule[className] ?? {};

    for (const day of days) {
      normalized[className][day] = {};
      const daySchedule = classSchedule[day] ?? {};

      for (const lessonNum of lessonNumbers) {
        const slot = daySchedule[lessonNum];
        if (!slot) {
          normalized[className][day]![lessonNum] = createEmptySlot();
        } else {
          // Ensure lessons array exists
          normalized[className][day]![lessonNum] = {
            lessons: Array.isArray(slot.lessons) ? [...slot.lessons] : [],
          };
        }
      }
    }
  }

  return normalized;
}

/**
 * Add a lesson to a slot (immutable - returns new schedule)
 */
export function addLessonToSlot(
  schedule: Schedule,
  className: string,
  day: Day,
  lessonNum: LessonNumber,
  lesson: ScheduledLesson
): Schedule {
  const existingLessons = getSlotLessons(schedule, className, day, lessonNum);

  return {
    ...schedule,
    [className]: {
      ...schedule[className],
      [day]: {
        ...schedule[className]?.[day],
        [lessonNum]: {
          lessons: [...existingLessons, lesson],
        },
      },
    },
  };
}

/**
 * Remove a lesson from a slot by index (immutable - returns new schedule)
 */
export function removeLessonFromSlot(
  schedule: Schedule,
  className: string,
  day: Day,
  lessonNum: LessonNumber,
  lessonIndex: number
): Schedule {
  const existingLessons = getSlotLessons(schedule, className, day, lessonNum);

  if (lessonIndex < 0 || lessonIndex >= existingLessons.length) {
    return schedule; // Invalid index, return unchanged
  }

  const newLessons = existingLessons.filter((_, i) => i !== lessonIndex);

  return {
    ...schedule,
    [className]: {
      ...schedule[className],
      [day]: {
        ...schedule[className]?.[day],
        [lessonNum]: {
          lessons: newLessons,
        },
      },
    },
  };
}

/**
 * Update a lesson's room (immutable - returns new schedule)
 */
export function updateLessonRoom(
  schedule: Schedule,
  className: string,
  day: Day,
  lessonNum: LessonNumber,
  lessonIndex: number,
  newRoom: string
): Schedule {
  const existingLessons = getSlotLessons(schedule, className, day, lessonNum);

  if (lessonIndex < 0 || lessonIndex >= existingLessons.length) {
    return schedule;
  }

  const newLessons = existingLessons.map((lesson, i) =>
    i === lessonIndex ? { ...lesson, room: newRoom } : lesson
  );

  return {
    ...schedule,
    [className]: {
      ...schedule[className],
      [day]: {
        ...schedule[className]?.[day],
        [lessonNum]: {
          lessons: newLessons,
        },
      },
    },
  };
}

/**
 * Replace a lesson at a specific index (immutable - returns new schedule)
 */
export function replaceLessonInSlot(
  schedule: Schedule,
  className: string,
  day: Day,
  lessonNum: LessonNumber,
  lessonIndex: number,
  newLesson: ScheduledLesson
): Schedule {
  const existingLessons = getSlotLessons(schedule, className, day, lessonNum);

  if (lessonIndex < 0 || lessonIndex >= existingLessons.length) {
    return schedule;
  }

  const newLessons = existingLessons.map((lesson, i) =>
    i === lessonIndex ? newLesson : lesson
  );

  return {
    ...schedule,
    [className]: {
      ...schedule[className],
      [day]: {
        ...schedule[className]?.[day],
        [lessonNum]: {
          lessons: newLessons,
        },
      },
    },
  };
}

/**
 * Deep clone a schedule
 */
export function cloneSchedule(schedule: Schedule): Schedule {
  return structuredClone(schedule);
}

/**
 * Check if two schedules are equal (deep comparison)
 */
/**
 * Check if a slot has a room change compared to the template.
 * A room change is when same teacher+subject+group but a different room.
 * Used to catch room-only changes that isSlotDifferentFromTemplate ignores.
 */
export function hasSlotRoomChange(
  currentLessons: ScheduledLesson[],
  templateLessons: ScheduledLesson[]
): boolean {
  for (const current of currentLessons) {
    const key = `${current.subject}|${current.teacher}|${current.group ?? ''}`;
    const template = templateLessons.find(
      t => `${t.subject}|${t.teacher}|${t.group ?? ''}` === key
    );
    if (template && current.room !== template.room) return true;
  }
  return false;
}

/**
 * Check if a slot's lessons differ from the template (ignoring room and group order).
 * Compares by subject|teacher key sets.
 */
export function isSlotDifferentFromTemplate(
  currentLessons: ScheduledLesson[],
  templateLessons: ScheduledLesson[]
): boolean {
  const currentSet = new Set(currentLessons.map(l => `${l.subject}|${l.teacher}|${l.group ?? ''}`));
  const templateSet = new Set(templateLessons.map(l => `${l.subject}|${l.teacher}|${l.group ?? ''}`));

  if (currentSet.size !== templateSet.size) return true;

  for (const item of currentSet) {
    if (!templateSet.has(item)) return true;
  }

  return false;
}

/**
 * Per-teacher comparison: true if THIS teacher's lessons differ structurally OR have a room
 * change between current and template. Isolates one teacher within a shared slot so that a
 * change to teacher B does not falsely flag teacher A as changed (Z27-1, Z28-2, Z29-3).
 *
 * Always use this instead of manually filtering arrays before calling isSlotDifferentFromTemplate.
 */
export function isTeacherSlotChanged(
  currentLessons: ScheduledLesson[],
  templateLessons: ScheduledLesson[],
  teacher: string,
): boolean {
  const cur = currentLessons.filter(l => l.teacher === teacher || l.teacher2 === teacher);
  const tmpl = templateLessons.filter(l => l.teacher === teacher || l.teacher2 === teacher);
  return isSlotDifferentFromTemplate(cur, tmpl) || hasSlotRoomChange(cur, tmpl);
}

/**
 * Compute per-teacher changed-cell keys for the Export teacher view.
 * Keys: "teacherName|className|day|lessonNum".
 * Per-teacher comparison — a change to one teacher's lesson in a shared slot does not
 * flag other teachers in that slot (Z28-2).
 */
export function computeTeacherChangedCells(
  schedule: Schedule,
  templateSchedule: Schedule,
  classNames: string[],
): Set<string> {
  const changed = new Set<string>();
  for (const className of classNames) {
    for (const day of DAYS) {
      for (const lessonNum of LESSON_NUMBERS) {
        const cur = schedule[className]?.[day]?.[lessonNum]?.lessons ?? [];
        const tmpl = templateSchedule[className]?.[day]?.[lessonNum]?.lessons ?? [];
        const teacherSet = new Set([
          ...cur.flatMap(l => [l.teacher, l.teacher2].filter(Boolean) as string[]),
          ...tmpl.flatMap(l => [l.teacher, l.teacher2].filter(Boolean) as string[]),
        ]);
        for (const t of teacherSet) {
          if (isTeacherSlotChanged(cur, tmpl, t)) {
            changed.add(`${t}|${className}|${day}|${lessonNum}`);
          }
        }
      }
    }
  }
  return changed;
}

/**
 * Compute the set of slots that differ between current and template schedules.
 * A slot is considered changed if lessons differ structurally (subject/teacher/group)
 * OR if a matching lesson has a different room.
 * Keys are formatted as "className|day|lessonNum".
 */
export function computeChangedCells(
  schedule: Schedule,
  templateSchedule: Schedule,
  classNames: string[],
): Set<string> {
  const changed = new Set<string>();
  for (const className of classNames) {
    for (const day of DAYS) {
      for (const lessonNum of LESSON_NUMBERS) {
        const current = schedule[className]?.[day]?.[lessonNum]?.lessons ?? [];
        const template = templateSchedule[className]?.[day]?.[lessonNum]?.lessons ?? [];
        if (isSlotDifferentFromTemplate(current, template) || hasSlotRoomChange(current, template)) {
          changed.add(`${className}|${day}|${lessonNum}`);
        }
      }
    }
  }
  return changed;
}

/**
 * Check if two schedules are equal (deep comparison)
 */
export function schedulesEqual(a: Schedule, b: Schedule): boolean {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();

  if (aKeys.length !== bKeys.length) return false;
  if (!aKeys.every((key, i) => key === bKeys[i])) return false;

  for (const className of aKeys) {
    const aClass = a[className];
    const bClass = b[className];

    for (const day of Object.keys(aClass) as Day[]) {
      const aDay = aClass[day];
      const bDay = bClass?.[day];

      if (!aDay && !bDay) continue;
      if (!aDay || !bDay) return false;

      for (const lessonNum of Object.keys(aDay).map(Number) as LessonNumber[]) {
        const aSlot = aDay[lessonNum];
        const bSlot = bDay[lessonNum];

        if (!aSlot && !bSlot) continue;
        if (!aSlot || !bSlot) return false;

        if (aSlot.lessons.length !== bSlot.lessons.length) return false;

        for (let i = 0; i < aSlot.lessons.length; i++) {
          const aLesson = aSlot.lessons[i];
          const bLesson = bSlot.lessons[i];

          if (
            aLesson.subject !== bLesson.subject ||
            aLesson.teacher !== bLesson.teacher ||
            aLesson.room !== bLesson.room ||
            aLesson.group !== bLesson.group
          ) {
            return false;
          }
        }
      }
    }
  }

  return true;
}
