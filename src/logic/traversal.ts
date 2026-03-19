/**
 * Schedule traversal helpers
 * Encapsulate the triple-nested schedule iteration pattern
 */

import type { Schedule, ScheduledLesson, Day, LessonNumber } from '@/types';

/**
 * Iterate every slot in every class of a schedule.
 */
export function forEachSlot(
  schedule: Schedule,
  callback: (className: string, day: Day, lessonNum: LessonNumber, lessons: ScheduledLesson[]) => void
): void {
  for (const [className, classSchedule] of Object.entries(schedule)) {
    for (const [day, daySchedule] of Object.entries(classSchedule)) {
      if (!daySchedule) continue;
      for (const [numStr, slot] of Object.entries(daySchedule)) {
        if (!slot?.lessons) continue;
        callback(className, day as Day, Number(numStr) as LessonNumber, slot.lessons);
      }
    }
  }
}

/**
 * Iterate a single time-slot across all classes.
 */
export function forEachSlotAt(
  schedule: Schedule,
  day: Day,
  lessonNum: LessonNumber,
  callback: (className: string, lessons: ScheduledLesson[]) => void
): void {
  for (const [className, classSchedule] of Object.entries(schedule)) {
    const lessons = classSchedule[day]?.[lessonNum]?.lessons ?? [];
    callback(className, lessons);
  }
}
