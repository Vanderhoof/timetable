import { describe, it, expect } from 'vitest';
import { detectGroupPairs, generateOutput } from './outputGenerator';
import type { Assignment, RNTeacher, HomeroomAssignment } from '../types';

const T1: RNTeacher = {
  id: 't1',
  name: 'Тихомирова Вера Ивановна',
  initials: 'ВИ',
  subjects: ['Физкультура'],
};
const T2: RNTeacher = {
  id: 't2',
  name: 'Юрова Светлана Петровна',
  initials: 'СП',
  subjects: ['Физкультура'],
};
const T3: RNTeacher = {
  id: 't3',
  name: 'Иванов Пётр Сергеевич',
  initials: 'ПС',
  subjects: ['Математика'],
};

const peA: Assignment = { teacherId: 't1', className: '5а', subject: 'Физкультура', hoursPerWeek: 3 };
const peB: Assignment = { teacherId: 't2', className: '5а', subject: 'Физкультура', hoursPerWeek: 3 };
const math: Assignment = { teacherId: 't3', className: '5а', subject: 'Математика', hoursPerWeek: 5 };

describe('detectGroupPairs', () => {
  it('detects a pair when two teachers assigned to same class+subject', () => {
    const pairs = detectGroupPairs([peA, peB], [T1, T2]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].className).toBe('5а');
    expect(pairs[0].subject).toBe('Физкультура');
    expect(pairs[0].groupNameA).toBe('5а (ВИ)');
    expect(pairs[0].groupNameB).toBe('5а (СП)');
  });

  it('does not detect a pair for single-teacher assignment', () => {
    const pairs = detectGroupPairs([math], [T3]);
    expect(pairs).toHaveLength(0);
  });

  it('does not detect pair for 3+ teachers (rare edge case)', () => {
    const t4: RNTeacher = { id: 't4', name: 'Третий', initials: 'Т', subjects: [] };
    const peC: Assignment = { ...peA, teacherId: 't4' };
    const pairs = detectGroupPairs([peA, peB, peC], [T1, T2, t4]);
    expect(pairs).toHaveLength(0); // length !== 2 → not a pair
  });
});

describe('generateOutput', () => {
  it('generates class-type requirement for single teacher', () => {
    const result = generateOutput([math], [T3], []);
    expect(result).toHaveLength(1);
    const req = result[0];
    expect(req.type).toBe('class');
    expect(req.classOrGroup).toBe('5а');
    expect(req.subject).toBe('Математика');
    expect(req.teacher).toBe(T3.name);
    expect(req.countPerWeek).toBe(5);
  });

  it('generates group-type requirements for split pair', () => {
    const result = generateOutput([peA, peB], [T1, T2], []);
    expect(result).toHaveLength(2);
    const groupA = result.find((r) => r.teacher === T1.name);
    const groupB = result.find((r) => r.teacher === T2.name);
    expect(groupA?.type).toBe('group');
    expect(groupA?.classOrGroup).toBe('5а (ВИ)');
    expect(groupA?.parallelGroup).toBe('5а (СП)');
    expect(groupA?.className).toBe('5а');
    expect(groupB?.type).toBe('group');
    expect(groupB?.classOrGroup).toBe('5а (СП)');
    expect(groupB?.parallelGroup).toBe('5а (ВИ)');
  });

  it('generates Разговоры о важном for homeroom', () => {
    const homeroom: HomeroomAssignment[] = [{ className: '5а', teacherId: 't3' }];
    const result = generateOutput([], [T3], homeroom);
    expect(result).toHaveLength(1);
    const req = result[0];
    expect(req.subject).toBe('Разговоры о важном');
    expect(req.type).toBe('class');
    expect(req.countPerWeek).toBe(1);
    expect(req.teacher).toBe(T3.name);
    expect(req.classOrGroup).toBe('5а');
  });

  it('assigns unique ids', () => {
    const result = generateOutput([math, peA, peB], [T1, T2, T3], [
      { className: '5а', teacherId: 't3' },
    ]);
    const ids = result.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('handles empty state', () => {
    expect(generateOutput([], [], [])).toEqual([]);
  });
});

describe('detectGroupPairs — bothGroups (З6-8)', () => {
  it('creates a pair with same teacher for both groups when bothGroups=true', () => {
    const a: Assignment = { ...peA, bothGroups: true };
    const pairs = detectGroupPairs([a], [T1]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].teacherAId).toBe('t1');
    expect(pairs[0].teacherBId).toBe('t1');
    expect(pairs[0].groupNameA).toBe('5а (гр.1)');
    expect(pairs[0].groupNameB).toBe('5а (гр.2)');
  });

  it('uses groupNameOverrides when provided', () => {
    const a: Assignment = { ...peA, bothGroups: true };
    const overrides = { '5а': { 'Физкультура': ['5а (Девочки)', '5а (Мальчики)'] as [string, string] } };
    const pairs = detectGroupPairs([a], [T1], overrides);
    expect(pairs[0].groupNameA).toBe('5а (Девочки)');
    expect(pairs[0].groupNameB).toBe('5а (Мальчики)');
  });

  it('uses groupNameOverrides for standard 2-teacher pair', () => {
    const overrides = { '5а': { 'Физкультура': ['Группа А', 'Группа Б'] as [string, string] } };
    const pairs = detectGroupPairs([peA, peB], [T1, T2], overrides);
    expect(pairs[0].groupNameA).toBe('Группа А');
    expect(pairs[0].groupNameB).toBe('Группа Б');
  });

  it('ignores single assignment without bothGroups', () => {
    const pairs = detectGroupPairs([peA], [T1]);
    expect(pairs).toHaveLength(0);
  });
});

describe('generateOutput — bothGroups (З6-8)', () => {
  it('generates two group requirements for a bothGroups assignment', () => {
    const a: Assignment = { ...peA, bothGroups: true };
    const result = generateOutput([a], [T1], []);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('group');
    expect(result[1].type).toBe('group');
    expect(result[0].teacher).toBe(T1.name);
    expect(result[1].teacher).toBe(T1.name);
    expect(result[0].classOrGroup).toBe('5а (гр.1)');
    expect(result[1].classOrGroup).toBe('5а (гр.2)');
    expect(result[0].parallelGroup).toBe('5а (гр.2)');
    expect(result[1].parallelGroup).toBe('5а (гр.1)');
  });

  it('uses groupNameOverrides in output', () => {
    const a: Assignment = { ...peA, bothGroups: true };
    const overrides = { '5а': { 'Физкультура': ['Д', 'М'] as [string, string] } };
    const result = generateOutput([a], [T1], [], overrides);
    expect(result[0].classOrGroup).toBe('Д');
    expect(result[1].classOrGroup).toBe('М');
  });
});
