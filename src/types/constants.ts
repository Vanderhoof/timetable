/**
 * Application-wide constants
 */

export const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;
export type Day = (typeof DAYS)[number];

export const MAX_LESSONS_PER_DAY = 8;
export const LESSON_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type LessonNumber = (typeof LESSON_NUMBERS)[number];

export const VERSION_TYPES = ['technical', 'template', 'weekly'] as const;
export type VersionType = (typeof VERSION_TYPES)[number];

export const CELL_STATUSES = [
  'available',
  'same',
  'teacher_banned',
  'teacher_busy',
  'class_occupied',
] as const;
export type CellStatus = (typeof CELL_STATUSES)[number];
