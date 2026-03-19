/**
 * З11-7: Generates a per-teacher workload PDF for a specific dept group.
 *
 * Format:
 * - Grouped by teacher (teacher name spans multiple rows)
 * - Columns: Учитель | Предмет | Классы | Итого по предмету | Всего у учителя
 */

import type { Assignment, RNTeacher, DeptGroup } from '../types';
import { getGroupSubjects } from './deptSnapshot';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface DeptTeacherEntry {
  teacherName: string;
  subjects: { subjectName: string; classes: string; subjectTotal: number }[];
  teacherTotal: number;
}

export function buildDeptReportData(
  group: DeptGroup,
  assignments: Assignment[],
  teachers: RNTeacher[],
): DeptTeacherEntry[] {
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const groupSubjects = new Set(getGroupSubjects(group));

  // Find all teachers in this group
  const groupTeacherIds = new Set(group.tables.flatMap((t) => t.teacherIds));

  // Filter relevant assignments
  const relevant = assignments.filter(
    (a) => groupTeacherIds.has(a.teacherId) && groupSubjects.has(a.subject),
  );

  // Group by teacher
  const byTeacher = new Map<string, Assignment[]>();
  for (const a of relevant) {
    if (!byTeacher.has(a.teacherId)) byTeacher.set(a.teacherId, []);
    byTeacher.get(a.teacherId)!.push(a);
  }

  const entries: DeptTeacherEntry[] = [];
  for (const [tid, tas] of byTeacher) {
    const teacher = teacherMap.get(tid);
    if (!teacher) continue;

    // Group by subject within this teacher
    const bySubject = new Map<string, Assignment[]>();
    for (const a of tas) {
      if (!bySubject.has(a.subject)) bySubject.set(a.subject, []);
      bySubject.get(a.subject)!.push(a);
    }

    const subjects = [...bySubject.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'ru'))
      .map(([subjectName, subjAssigns]) => {
        const classes = subjAssigns
          .sort((a, b) => a.className.localeCompare(b.className, 'ru'))
          .map((a) => `${a.className}(${a.hoursPerWeek})`)
          .join(', ');
        const subjectTotal = subjAssigns.reduce((s, a) => s + a.hoursPerWeek, 0);
        return { subjectName, classes, subjectTotal };
      });

    const teacherTotal = subjects.reduce((s, e) => s + e.subjectTotal, 0);
    entries.push({ teacherName: teacher.name, subjects, teacherTotal });
  }

  return entries.sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ru'));
}

export function buildDeptReportHtml(group: DeptGroup, entries: DeptTeacherEntry[]): string {
  const rows: string[] = [];

  for (const entry of entries) {
    const rs = entry.subjects.length || 1;

    entry.subjects.forEach((subj, i) => {
      const teacherCell =
        i === 0
          ? `<td class="teacher" rowspan="${rs}"><strong>${esc(entry.teacherName)}</strong></td>`
          : '';
      const totalCell =
        i === 0
          ? `<td class="c bold" rowspan="${rs}">${entry.teacherTotal}</td>`
          : '';
      rows.push(`
        <tr>
          ${teacherCell}
          <td>${esc(subj.subjectName)}</td>
          <td>${esc(subj.classes)}</td>
          <td class="c">${subj.subjectTotal}</td>
          ${totalCell}
        </tr>`);
    });

    if (rs === 0) {
      rows.push(`
        <tr>
          <td><strong>${esc(entry.teacherName)}</strong></td>
          <td colspan="3" class="c" style="color:#999">нет назначений</td>
          <td class="c bold">0</td>
        </tr>`);
    }

    rows.push('<tr class="gap"><td colspan="5"></td></tr>');
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Нагрузка кафедры ${esc(group.name)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
  h2 { text-align: center; margin: 0 0 2px; font-size: 14px; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  th { background: #d0d0d0; padding: 5px 7px; border: 1px solid #555;
       text-align: center; font-size: 11px; }
  td { border: 1px solid #888; padding: 4px 6px; vertical-align: top; font-size: 11px; }
  .teacher { background: #e8f0ff; min-width: 140px; max-width: 180px; }
  .c { text-align: center; }
  .bold { font-weight: 700; }
  .gap td { border: none; height: 4px; background: #fff; padding: 0; }
  .btn { padding: 8px 24px; font-size: 14px; cursor: pointer; }
  .actions { margin-top: 16px; text-align: center; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .actions { display: none; }
  }
</style>
</head>
<body>
<h2>Нагрузка кафедры «${esc(group.name)}»</h2>
<table>
  <thead>
    <tr>
      <th style="width:160px">Учитель</th>
      <th style="width:140px">Предмет</th>
      <th>Классы (ч/нед)</th>
      <th style="width:55px">Итого<br>предмет</th>
      <th style="width:55px">Всего<br>учитель</th>
    </tr>
  </thead>
  <tbody>
    ${rows.join('')}
  </tbody>
</table>
<div class="actions">
  <button class="btn" onclick="window.print()">Печать / Сохранить PDF</button>
  <button class="btn" onclick="window.close()" style="margin-left:12px">Закрыть</button>
</div>
</body>
</html>`;
}

export function printDeptReport(group: DeptGroup, entries: DeptTeacherEntry[]): void {
  const html = buildDeptReportHtml(group, entries);
  const w = window.open('', '_blank');
  if (!w) {
    alert('Не удалось открыть окно печати. Разрешите всплывающие окна для этой страницы.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
