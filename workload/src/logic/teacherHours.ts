import type { Assignment } from '../types';

/**
 * Total weekly lesson hours for a teacher across all assignments.
 * З7-2: homeroom (Разговоры о важном) is NOT included — paid separately.
 * bothGroups assignments count as 2 × hoursPerWeek.
 */
export function computeTeacherTotalHours(
  teacherId: string,
  assignments: Assignment[],
): number {
  return assignments
    .filter((a) => a.teacherId === teacherId)
    .reduce((sum, a) => sum + a.hoursPerWeek * (a.bothGroups ? 2 : 1), 0);
}
