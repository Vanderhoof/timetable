/**
 * Group name generation.
 *
 * When two teachers are assigned to the same class+subject, the class is
 * split into two groups named after the teachers' initials:
 *   "5-а (ЛВ)" and "5-а (АН)"
 *
 * Initials format: two uppercase letters without dots (З3-7).
 */

/**
 * Derive initials from a full name string.
 * "Арутюнян Лариса Вадимовна" → "ЛВ"
 * "Юрова Вера" → "В"
 * "Иванов" → "И"
 */
export function deriveInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  // parts[0] = Фамилия, parts[1] = Имя, parts[2] = Отчество (optional)
  const first = parts[1].charAt(0).toUpperCase();
  const patronymic = parts[2] ? parts[2].charAt(0).toUpperCase() : '';
  return first + patronymic;
}

/**
 * Migrate old "Н.В." format to new "НВ" format (strip all dots).
 */
export function migrateInitials(s: string): string {
  return s.replace(/\./g, '');
}

/**
 * Build group name: "className (initials)"
 * e.g. groupName("5-а", "ЛВ") → "5-а (ЛВ)"
 */
export function groupName(className: string, initials: string): string {
  return `${className} (${initials})`;
}

/**
 * Short display name: "Фамилия И.О." (З5-1, З5-4)
 * "Алимова Евгения Владимировна" → "Алимова Е.В."
 * "Юрова Вера"                  → "Юрова В."
 * "Иванов"                      → "Иванов"
 */
export function shortTeacherName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const surname = parts[0];
  const firstInitial = parts[1].charAt(0).toUpperCase() + '.';
  const patronymicInitial = parts[2] ? parts[2].charAt(0).toUpperCase() + '.' : '';
  return `${surname} ${firstInitial}${patronymicInitial}`;
}

/**
 * Build both group names for a split pair.
 * Returns [groupNameA, groupNameB].
 */
export function groupPairNames(
  className: string,
  initialsA: string,
  initialsB: string,
): [string, string] {
  return [groupName(className, initialsA), groupName(className, initialsB)];
}
