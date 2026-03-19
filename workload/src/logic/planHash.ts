import type { CurriculumPlan } from '../types';

/**
 * Deterministic djb2 hash of the UP structure (grades, subjects, hours, groupSplit).
 * Excludes groupNameOverrides and groupCounts — those are presentation details,
 * not structural changes that would invalidate dept snapshot files.
 *
 * Used by MU-1/MU-2 to block import when the UP structure has changed since
 * the snapshot was created.
 */
export function computePlanHash(plan: CurriculumPlan): string {
  // Build a canonical string representation, sorted to be order-independent
  const parts: string[] = [];

  for (const grade of [...plan.grades].sort((a, b) => a.grade - b.grade)) {
    const sortedSubjects = [...grade.subjects].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const subj of sortedSubjects) {
      // Sort class names for deterministic order
      const classEntries = Object.entries(subj.hoursPerClass).sort(([a], [b]) =>
        a.localeCompare(b),
      );
      const hoursStr = classEntries
        .map(([cls, h]) => `${cls}:${h}`)
        .join(',');
      parts.push(`${grade.grade}|${subj.name}|${hoursStr}|${subj.groupSplit ? '2' : '1'}`);
    }
  }

  const canonical = parts.join(';');
  return djb2(canonical).toString(16);
}

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    // Keep as 32-bit unsigned integer
    hash = hash >>> 0;
  }
  return hash;
}
