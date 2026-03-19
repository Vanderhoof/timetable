/**
 * Substitution (replacement teacher) types
 */

import type { Day, LessonNumber } from './constants';

/**
 * Record of a teacher substitution
 */
export interface Substitution {
  id: string;
  /** Teacher being replaced */
  originalTeacher: string;
  /** Teacher doing the replacement */
  replacingTeacher: string;
  /** Date of substitution */
  date: Date;
  /** Day of week */
  day: Day;
  /** Lesson number */
  lessonNum: LessonNumber;
  /** Class or group name */
  classOrGroup: string;
  /** Subject being taught */
  subject: string;
}

/**
 * Format: "Плескачева В.И. за Алимова Е.В. 20/01/2026-4 10а Геометрия"
 */
export function formatSubstitution(sub: Substitution): string {
  const dateStr = sub.date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${sub.replacingTeacher} за ${sub.originalTeacher} ${dateStr}-${sub.lessonNum} ${sub.classOrGroup} ${sub.subject}`;
}
