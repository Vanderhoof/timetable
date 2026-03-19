import { describe, it, expect } from 'vitest';
import { createUPSnapshot, parseUPSnapshot, detectOrphanedSubjects } from './upSnapshot';
import { computePlanHash } from './planHash';
import type { CurriculumPlan, Assignment } from '../types';

const basePlan: CurriculumPlan = {
  classNames: ['5а'],
  grades: [
    {
      grade: 5,
      subjects: [
        { name: 'Математика', shortName: 'Мат', hoursPerClass: { '5а': 4 }, groupSplit: false, part: 'mandatory' as const },
        { name: 'Физкультура', shortName: 'Физ', hoursPerClass: { '5а': 3 }, groupSplit: true, part: 'mandatory' as const },
      ],
    },
  ],
};

function makeAssignment(subject: string): Assignment {
  return { teacherId: 't1', className: '5а', subject, hoursPerWeek: 4 };
}

describe('createUPSnapshot', () => {
  it('creates a well-formed snapshot', () => {
    const snap = createUPSnapshot(basePlan);
    expect(snap.type).toBe('up-snapshot');
    expect(snap.version).toBe(1);
    expect(snap.planHash).toBe(computePlanHash(basePlan));
    expect(snap.plan).toBe(basePlan);
    expect(typeof snap.exportedAt).toBe('string');
  });
});

describe('parseUPSnapshot', () => {
  it('accepts a valid snapshot', () => {
    const snap = createUPSnapshot(basePlan);
    const parsed = parseUPSnapshot(snap);
    expect(parsed.type).toBe('up-snapshot');
  });

  it('throws when type is missing', () => {
    expect(() => parseUPSnapshot({ version: 1, planHash: 'abc', plan: basePlan })).toThrow(
      /тип файла/i,
    );
  });

  it('throws when type is dept-snapshot', () => {
    expect(() =>
      parseUPSnapshot({ type: 'dept-snapshot', version: 1, planHash: 'abc', plan: basePlan }),
    ).toThrow(/тип файла/i);
  });

  it('throws when not an object', () => {
    expect(() => parseUPSnapshot('hello')).toThrow(/объект JSON/i);
  });

  it('throws when planHash is missing', () => {
    expect(() =>
      parseUPSnapshot({ type: 'up-snapshot', version: 1, plan: basePlan }),
    ).toThrow(/planHash/i);
  });

  it('throws when plan is missing', () => {
    expect(() =>
      parseUPSnapshot({ type: 'up-snapshot', version: 1, planHash: 'abc' }),
    ).toThrow(/учебный план/i);
  });

  it('throws on unsupported version', () => {
    expect(() =>
      parseUPSnapshot({ type: 'up-snapshot', version: 2, planHash: 'abc', plan: basePlan }),
    ).toThrow(/версия/i);
  });
});

describe('detectOrphanedSubjects', () => {
  it('returns empty array when no orphans', () => {
    const assignments = [makeAssignment('Математика'), makeAssignment('Физкультура')];
    expect(detectOrphanedSubjects(basePlan, assignments)).toEqual([]);
  });

  it('returns orphaned subject names sorted', () => {
    const assignments = [
      makeAssignment('Математика'),
      makeAssignment('Химия'),
      makeAssignment('Биология'),
    ];
    expect(detectOrphanedSubjects(basePlan, assignments)).toEqual(['Биология', 'Химия']);
  });

  it('deduplicates orphaned subjects', () => {
    const assignments = [makeAssignment('Химия'), makeAssignment('Химия')];
    expect(detectOrphanedSubjects(basePlan, assignments)).toEqual(['Химия']);
  });

  it('returns empty when assignments are empty', () => {
    expect(detectOrphanedSubjects(basePlan, [])).toEqual([]);
  });
});
