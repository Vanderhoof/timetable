/**
 * Lesson formatting utilities for consistent display across the app
 *
 * Standard format: Предмет (индекс группы) Учитель -Кабинет-
 * Example: Английский (В.Е.) Лихачева В.Е. -2.6-
 */

/**
 * Wrap a room name in dashes if it doesn't already have them.
 * Room short names from the data may already include dashes (e.g., "-2.6-").
 */
export function formatRoom(room: string): string {
  if (room.startsWith('-') && room.endsWith('-')) return room;
  return `-${room}-`;
}

export interface LessonDisplayParts {
  subject: string;
  groupIndex?: string;
  teacher?: string;
  room?: string;
  className?: string;
}

/**
 * Extract group index from a group string
 * e.g., "10а(В.Е.)" -> "В.Е."
 * e.g., "д" -> "д"
 */
export function extractGroupIndex(group: string | undefined): string | undefined {
  if (!group) return undefined;
  // Try to extract content from parentheses at the end
  const match = group.match(/\(([^)]+)\)$/);
  if (match) {
    return match[1];
  }
  // Otherwise return the whole group as-is
  return group;
}

/**
 * Format a lesson for display in grid cells and export views
 *
 * Modes:
 * - 'full': Subject (group) Teacher -Room- (default, for grid cells and by-class export)
 * - 'by-teacher': ClassName (group) Subject -Room- (for by-teacher export)
 * - 'by-room': ClassName (group) Subject Teacher (for by-room export)
 */
export function formatLessonDisplay(
  parts: LessonDisplayParts,
  mode: 'full' | 'by-teacher' | 'by-room' = 'full'
): { formatted: string; elements: React.ReactNode[] } {
  const groupIndex = extractGroupIndex(parts.groupIndex);

  // Build string representation
  let formatted = '';

  switch (mode) {
    case 'full':
      formatted = parts.subject;
      if (groupIndex) formatted += ` (${groupIndex})`;
      if (parts.teacher) formatted += ` ${parts.teacher}`;
      if (parts.room) formatted += ` ${formatRoom(parts.room)}`;
      break;

    case 'by-teacher':
      if (parts.className) formatted = parts.className;
      if (groupIndex) formatted += ` (${groupIndex})`;
      formatted += ` ${parts.subject}`;
      if (parts.room) formatted += ` ${formatRoom(parts.room)}`;
      break;

    case 'by-room':
      if (parts.className) formatted = parts.className;
      if (groupIndex) formatted += ` (${groupIndex})`;
      formatted += ` ${parts.subject}`;
      if (parts.teacher) formatted += ` ${parts.teacher}`;
      break;
  }

  return { formatted, elements: [] };
}

/**
 * Format lesson for grid cells (simple string version)
 * Returns: "Subject (group) Teacher -Room-"
 */
export function formatLessonCell(
  subject: string,
  teacher: string,
  room: string,
  group?: string
): string {
  const groupIndex = extractGroupIndex(group);
  let result = subject;
  if (groupIndex) result += ` (${groupIndex})`;
  result += ` ${teacher}`;
  result += ` ${formatRoom(room)}`;
  return result;
}

/**
 * Format lesson for by-teacher export view
 * Returns: "ClassName (group) Subject -Room-"
 */
export function formatLessonByTeacher(
  className: string,
  subject: string,
  room: string,
  group?: string
): string {
  const groupIndex = extractGroupIndex(group);
  let result = className;
  if (groupIndex) result += ` (${groupIndex})`;
  result += ` ${subject}`;
  result += ` ${formatRoom(room)}`;
  return result;
}

/**
 * Format lesson for by-room export view
 * Returns: "ClassName (group) Subject Teacher"
 */
export function formatLessonByRoom(
  className: string,
  subject: string,
  teacher: string,
  group?: string
): string {
  const groupIndex = extractGroupIndex(group);
  let result = className;
  if (groupIndex) result += ` (${groupIndex})`;
  result += ` ${subject}`;
  result += ` ${teacher}`;
  return result;
}

/**
 * Compare class names with numeric-aware sorting.
 * "5а" < "9б" < "11в" (not alphabetic "11в" < "5а")
 */
export function compareClassNames(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { numeric: true });
}

/**
 * Escape HTML special characters for use in HTML clipboard content.
 * Handles &, <, > — sufficient for schedule text (no quotes in attributes).
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
