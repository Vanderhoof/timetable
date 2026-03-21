import type { CurriculumPlan, SubjectRow } from '../types';

/**
 * Toggles groupSplit for a subject across parallels.
 * @param onlyThisGrade  If true, only the given grade is affected; otherwise all grades
 *                       with the same (name, part) are toggled together.
 */
export function applyGroupSplitToggle(
  plan: CurriculumPlan,
  grade: number,
  subjectName: string,
  part: SubjectRow['part'],
  onlyThisGrade: boolean,
): CurriculumPlan {
  return {
    ...plan,
    grades: plan.grades.map((g) => ({
      ...g,
      subjects: g.subjects.map((s) => {
        if (s.name !== subjectName || s.part !== part) return s;
        if (onlyThisGrade && g.grade !== grade) return s;
        return { ...s, groupSplit: !s.groupSplit };
      }),
    })),
  };
}
