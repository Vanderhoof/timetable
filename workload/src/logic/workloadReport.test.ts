import { describe, it, expect } from 'vitest';
import { generateWorkloadReport } from './workloadReport';
import type { Assignment, RNTeacher, HomeroomAssignment } from '../types';

const TEACHERS: RNTeacher[] = [
  { id: 't1', name: 'Иванов П.А.', initials: 'П.А.', subjects: [] },
  { id: 't2', name: 'Борисова С.В.', initials: 'С.В.', subjects: [] },
];

describe('generateWorkloadReport', () => {
  it('groups assignments by subject', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
      { teacherId: 't1', className: '5-б', subject: 'Физкультура', hoursPerWeek: 3 },
    ];
    const blocks = generateWorkloadReport(assignments, TEACHERS, []);
    expect(blocks.map((b) => b.subjectName)).toContain('Математика');
    expect(blocks.map((b) => b.subjectName)).toContain('Физкультура');
  });

  it('subjects are sorted alphabetically', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '5-а', subject: 'Физкультура', hoursPerWeek: 3 },
      { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
    ];
    const names = generateWorkloadReport(assignments, TEACHERS, []).map((b) => b.subjectName);
    expect(names.indexOf('Математика')).toBeLessThan(names.indexOf('Физкультура'));
  });

  it('calculates total hours for subject block', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
      { teacherId: 't1', className: '5-б', subject: 'Математика', hoursPerWeek: 5 },
      { teacherId: 't2', className: '6-а', subject: 'Математика', hoursPerWeek: 4 },
    ];
    const block = generateWorkloadReport(assignments, TEACHERS, []).find(
      (b) => b.subjectName === 'Математика',
    )!;
    expect(block.totalHours).toBe(14);
  });

  it('calculates total hours per teacher within subject', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
      { teacherId: 't1', className: '5-б', subject: 'Математика', hoursPerWeek: 5 },
    ];
    const block = generateWorkloadReport(assignments, TEACHERS, []).find(
      (b) => b.subjectName === 'Математика',
    )!;
    expect(block.teachers[0].totalHours).toBe(10);
  });

  it('splits classes into 5-9 and 10-11 groups', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
      { teacherId: 't1', className: '10-а', subject: 'Математика', hoursPerWeek: 4 },
    ];
    const entry = generateWorkloadReport(assignments, TEACHERS, [])[0].teachers[0];
    expect(entry.classes59).toBe('5-а(5)');
    expect(entry.classes1011).toBe('10-а(4)');
  });

  it('grade 9 goes into 5-9 column, grade 10 goes into 10-11', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '9-а', subject: 'Химия', hoursPerWeek: 2 },
      { teacherId: 't1', className: '11-б', subject: 'Химия', hoursPerWeek: 2 },
    ];
    const entry = generateWorkloadReport(assignments, TEACHERS, [])[0].teachers[0];
    expect(entry.classes59).toContain('9-а');
    expect(entry.classes1011).toContain('11-б');
  });

  it('includes homeroom class in teacher entry', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
    ];
    const homeroom: HomeroomAssignment[] = [{ className: '5-а', teacherId: 't1' }];
    const entry = generateWorkloadReport(assignments, TEACHERS, homeroom)[0].teachers[0];
    expect(entry.homeroomClass).toBe('5-а');
  });

  it('homeroomClass is empty if not a homeroom teacher', () => {
    const assignments: Assignment[] = [
      { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
    ];
    const entry = generateWorkloadReport(assignments, TEACHERS, [])[0].teachers[0];
    expect(entry.homeroomClass).toBe('');
  });

  it('adds Разговоры о важном block for homeroom teachers', () => {
    const homeroom: HomeroomAssignment[] = [
      { className: '5-а', teacherId: 't1' },
      { className: '6-б', teacherId: 't2' },
    ];
    const blocks = generateWorkloadReport([], TEACHERS, homeroom);
    const razg = blocks.find((b) => b.subjectName === 'Разговоры о важном');
    expect(razg).toBeDefined();
    expect(razg!.teachers).toHaveLength(2);
    expect(razg!.totalHours).toBe(2);
  });

  it('Разговоры о важном: each teacher gets 1 hour, class in correct column', () => {
    const homeroom: HomeroomAssignment[] = [{ className: '7-в', teacherId: 't1' }];
    const blocks = generateWorkloadReport([], TEACHERS, homeroom);
    const entry = blocks.find((b) => b.subjectName === 'Разговоры о важном')!.teachers[0];
    expect(entry.totalHours).toBe(1);
    expect(entry.classes59).toBe('7-в(1)');
    expect(entry.classes1011).toBe('');
  });

  it('skips unknown teacher ids gracefully', () => {
    const assignments: Assignment[] = [
      { teacherId: 'unknown', className: '5-а', subject: 'Математика', hoursPerWeek: 5 },
    ];
    const blocks = generateWorkloadReport(assignments, TEACHERS, []);
    // Block may be empty or absent — either way no crash
    const block = blocks.find((b) => b.subjectName === 'Математика');
    expect(block).toBeUndefined(); // filtered out since no teachers
  });

  it('returns empty array when no assignments or homeroom', () => {
    expect(generateWorkloadReport([], TEACHERS, [])).toHaveLength(0);
  });
});
