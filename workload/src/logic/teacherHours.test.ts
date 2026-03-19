import { describe, it, expect } from 'vitest';
import { computeTeacherTotalHours } from './teacherHours';
import type { Assignment } from '../types';

function a(overrides: Partial<Assignment> = {}): Assignment {
  return { teacherId: 't1', className: '5-а', subject: 'Математика', hoursPerWeek: 4, ...overrides };
}

describe('computeTeacherTotalHours', () => {
  it('returns 0 with no assignments', () => {
    expect(computeTeacherTotalHours('t1', [])).toBe(0);
  });

  it('sums assignments for the teacher', () => {
    expect(computeTeacherTotalHours('t1', [
      a({ hoursPerWeek: 4 }),
      a({ className: '6-а', hoursPerWeek: 3 }),
    ])).toBe(7);
  });

  it('ignores other teachers', () => {
    expect(computeTeacherTotalHours('t1', [
      a({ teacherId: 't1', hoursPerWeek: 4 }),
      a({ teacherId: 't2', hoursPerWeek: 5 }),
    ])).toBe(4);
  });

  it('counts bothGroups as 2× hoursPerWeek', () => {
    expect(computeTeacherTotalHours('t1', [a({ hoursPerWeek: 3, bothGroups: true })])).toBe(6);
  });

  it('mixes normal and bothGroups correctly', () => {
    expect(computeTeacherTotalHours('t1', [
      a({ hoursPerWeek: 4 }),
      a({ className: '5-б', hoursPerWeek: 2, bothGroups: true }),
    ])).toBe(8); // 4 + 2*2
  });

  it('does not count homeroom — no parameter, not in scope (З7-2)', () => {
    // The function takes only assignments, not homeroomAssignments
    // This test documents the intentional omission
    const result = computeTeacherTotalHours('t1', [a({ hoursPerWeek: 5 })]);
    expect(result).toBe(5);
  });
});
