import type { CurriculumPlan, Assignment } from '../types';
import { computePlanHash } from './planHash';

export interface UPSnapshotFile {
  type: 'up-snapshot';
  version: 1;
  exportedAt: string;
  planHash: string;
  plan: CurriculumPlan;
}

/**
 * Create a UP-snapshot file object ready for JSON.stringify.
 * Includes the full curriculumPlan (groupNameOverrides, groupCounts are preserved).
 */
export function createUPSnapshot(plan: CurriculumPlan): UPSnapshotFile {
  return {
    type: 'up-snapshot',
    version: 1,
    exportedAt: new Date().toISOString(),
    planHash: computePlanHash(plan),
    plan,
  };
}

/**
 * Validate raw parsed JSON and return a typed UPSnapshotFile.
 * Throws a descriptive error if validation fails.
 */
export function parseUPSnapshot(data: unknown): UPSnapshotFile {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Файл повреждён: ожидается объект JSON.');
  }
  const d = data as Record<string, unknown>;
  if (d.type !== 'up-snapshot') {
    throw new Error(
      `Неверный тип файла: ожидается "up-snapshot", получено "${d.type ?? 'неизвестно'}".`,
    );
  }
  if (d.version !== 1) {
    throw new Error(`Неподдерживаемая версия формата: ${d.version}.`);
  }
  if (typeof d.planHash !== 'string' || !d.planHash) {
    throw new Error('Файл повреждён: отсутствует planHash.');
  }
  if (typeof d.plan !== 'object' || d.plan === null) {
    throw new Error('Файл повреждён: отсутствует учебный план.');
  }
  return data as UPSnapshotFile;
}

/**
 * Find subject names in assignments that are not present in the new plan.
 * Returns an array of orphaned subject names.
 */
export function detectOrphanedSubjects(
  plan: CurriculumPlan,
  assignments: Assignment[],
): string[] {
  const knownSubjects = new Set<string>();
  for (const grade of plan.grades) {
    for (const subj of grade.subjects) {
      knownSubjects.add(subj.name);
    }
  }

  const orphaned = new Set<string>();
  for (const a of assignments) {
    if (!knownSubjects.has(a.subject)) {
      orphaned.add(a.subject);
    }
  }
  return [...orphaned].sort();
}
