import { describe, it, expect } from 'vitest';
import { buildDeptReportData, buildDeptReportHtml } from './deptReport';
import type { DeptGroup, Assignment, RNTeacher } from '../types';

const GROUP: DeptGroup = {
  id: 'math',
  name: 'Математики',
  tables: [
    { id: 'math-t1', name: 'Математика', teacherIds: ['t1', 't2'], subjectFilter: ['Математика', 'Алгебра'] },
  ],
};

const TEACHERS: RNTeacher[] = [
  { id: 't1', name: 'Иванов Иван Иванович', initials: 'ИИ', subjects: ['Математика'] },
  { id: 't2', name: 'Петров Пётр Петрович', initials: 'ПП', subjects: ['Алгебра'] },
];

const ASSIGNMENTS: Assignment[] = [
  { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
  { teacherId: 't1', className: '5-б', subject: 'Математика', hoursPerWeek: 5 },
  { teacherId: 't2', className: '8-а', subject: 'Алгебра', hoursPerWeek: 4 },
  { teacherId: 't2', className: '8-б', subject: 'Алгебра', hoursPerWeek: 4 },
  // assignment for unrelated subject/teacher — should not appear
  { teacherId: 't1', className: '5-а', subject: 'Физика', hoursPerWeek: 3 },
];

describe('buildDeptReportData', () => {
  it('includes only assignments for teachers in the group', () => {
    const entries = buildDeptReportData(GROUP, ASSIGNMENTS, TEACHERS);
    const names = entries.map((e) => e.teacherName);
    expect(names).toContain('Иванов Иван Иванович');
    expect(names).toContain('Петров Пётр Петрович');
  });

  it('excludes subjects not in the group subject filter', () => {
    const entries = buildDeptReportData(GROUP, ASSIGNMENTS, TEACHERS);
    const ivan = entries.find((e) => e.teacherName === 'Иванов Иван Иванович')!;
    const subjectNames = ivan.subjects.map((s) => s.subjectName);
    expect(subjectNames).not.toContain('Физика');
  });

  it('computes correct teacher total', () => {
    const entries = buildDeptReportData(GROUP, ASSIGNMENTS, TEACHERS);
    const ivan = entries.find((e) => e.teacherName === 'Иванов Иван Иванович')!;
    expect(ivan.teacherTotal).toBe(10); // 5 + 5
    const petrov = entries.find((e) => e.teacherName === 'Петров Пётр Петрович')!;
    expect(petrov.teacherTotal).toBe(8); // 4 + 4
  });

  it('computes correct subject total', () => {
    const entries = buildDeptReportData(GROUP, ASSIGNMENTS, TEACHERS);
    const ivan = entries.find((e) => e.teacherName === 'Иванов Иван Иванович')!;
    const math = ivan.subjects.find((s) => s.subjectName === 'Математика')!;
    expect(math.subjectTotal).toBe(10);
    expect(math.classes).toContain('5-а(5)');
    expect(math.classes).toContain('5-б(5)');
  });

  it('returns empty array when no relevant assignments', () => {
    const entries = buildDeptReportData(GROUP, [], TEACHERS);
    expect(entries).toHaveLength(0);
  });
});

describe('buildDeptReportHtml', () => {
  it('contains teacher names in output', () => {
    const entries = buildDeptReportData(GROUP, ASSIGNMENTS, TEACHERS);
    const html = buildDeptReportHtml(GROUP, entries);
    expect(html).toContain('Иванов Иван Иванович');
    expect(html).toContain('Петров Пётр Петрович');
  });

  it('contains group name in title', () => {
    const entries = buildDeptReportData(GROUP, ASSIGNMENTS, TEACHERS);
    const html = buildDeptReportHtml(GROUP, entries);
    expect(html).toContain('Математики');
  });

  it('contains hour totals', () => {
    const entries = buildDeptReportData(GROUP, ASSIGNMENTS, TEACHERS);
    const html = buildDeptReportHtml(GROUP, entries);
    expect(html).toContain('10'); // teacher total for Иванов
  });
});
