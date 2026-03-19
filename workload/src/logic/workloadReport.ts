/**
 * Generates the workload report data (нагрузка учителей).
 *
 * Output groups assignments by subject. Each subject block lists all
 * teachers teaching that subject, with their class lists split into
 * grades 5–9 and grades 10–11, plus total hours.
 *
 * "Разговоры о важном" (1h/week, from homeroom assignments) is appended
 * as a separate subject block at the end.
 */

import type { Assignment, RNTeacher, HomeroomAssignment } from '../types';

export interface TeacherSubjectEntry {
  teacherName: string;
  homeroomClass: string; // '' if not a homeroom teacher
  classes59: string;     // e.g. "5-а(5), 5-б(5)"
  classes1011: string;   // e.g. "10-а(4)"
  totalHours: number;
}

export interface SubjectBlock {
  subjectName: string;
  totalHours: number;
  teachers: TeacherSubjectEntry[];
}

function gradeFromClassName(cn: string): number {
  const m = cn.match(/^(\d{1,2})/);
  return m ? parseInt(m[1], 10) : 0;
}

function formatClasses(entries: { className: string; hours: number }[]): string {
  if (entries.length === 0) return '';
  return entries.map((e) => `${e.className}(${e.hours})`).join(', ');
}

export function generateWorkloadReport(
  assignments: Assignment[],
  teachers: RNTeacher[],
  homeroomAssignments: HomeroomAssignment[],
): SubjectBlock[] {
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const homeroomMap = new Map(homeroomAssignments.map((h) => [h.teacherId, h.className]));

  const subjects = [...new Set(assignments.map((a) => a.subject))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  );

  const blocks: SubjectBlock[] = subjects
    .map((subjectName) => {
      const subjectAssignments = assignments.filter((a) => a.subject === subjectName);
      const teacherIds = [...new Set(subjectAssignments.map((a) => a.teacherId))];

      let totalHours = 0;
      const teacherEntries: TeacherSubjectEntry[] = teacherIds
        .map((tid) => {
          const teacher = teacherMap.get(tid);
          if (!teacher) return null;

          const ta = subjectAssignments.filter((a) => a.teacherId === tid);
          const classes59 = ta
            .filter((a) => gradeFromClassName(a.className) <= 9)
            .map((a) => ({ className: a.className, hours: a.hoursPerWeek }));
          const classes1011 = ta
            .filter((a) => gradeFromClassName(a.className) >= 10)
            .map((a) => ({ className: a.className, hours: a.hoursPerWeek }));
          const teacherTotal = ta.reduce((s, a) => s + a.hoursPerWeek, 0);
          totalHours += teacherTotal;

          return {
            teacherName: teacher.name,
            homeroomClass: homeroomMap.get(tid) ?? '',
            classes59: formatClasses(classes59),
            classes1011: formatClasses(classes1011),
            totalHours: teacherTotal,
          };
        })
        .filter((e): e is TeacherSubjectEntry => e !== null)
        .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ru'));

      return { subjectName, totalHours, teachers: teacherEntries };
    })
    .filter((b) => b.teachers.length > 0);

  // "Разговоры о важном" from homeroom assignments
  if (homeroomAssignments.length > 0) {
    const razgTeachers: TeacherSubjectEntry[] = homeroomAssignments
      .map((h) => {
        const teacher = teacherMap.get(h.teacherId);
        if (!teacher) return null;
        const grade = gradeFromClassName(h.className);
        return {
          teacherName: teacher.name,
          homeroomClass: h.className,
          classes59: grade <= 9 ? `${h.className}(1)` : '',
          classes1011: grade >= 10 ? `${h.className}(1)` : '',
          totalHours: 1,
        };
      })
      .filter((e): e is TeacherSubjectEntry => e !== null)
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ru'));

    if (razgTeachers.length > 0) {
      blocks.push({
        subjectName: 'Разговоры о важном',
        totalHours: razgTeachers.length,
        teachers: razgTeachers,
      });
    }
  }

  return blocks;
}
