import { describe, it, expect } from 'vitest';
import { computePlanHash } from './planHash';
import type { CurriculumPlan } from '../types';

function makePlan(overrides: Partial<CurriculumPlan> = {}): CurriculumPlan {
  return {
    classNames: ['5а', '5б'],
    grades: [
      {
        grade: 5,
        subjects: [
          { name: 'Математика', shortName: 'Мат', hoursPerClass: { '5а': 4, '5б': 4 }, groupSplit: false, part: 'mandatory' as const },
          { name: 'Физкультура', shortName: 'Физ', hoursPerClass: { '5а': 3, '5б': 3 }, groupSplit: true, part: 'mandatory' as const },
        ],
      },
    ],
    ...overrides,
  };
}

describe('computePlanHash', () => {
  it('returns a non-empty hex string', () => {
    const hash = computePlanHash(makePlan());
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('same plan → same hash', () => {
    expect(computePlanHash(makePlan())).toBe(computePlanHash(makePlan()));
  });

  it('different hours → different hash', () => {
    const a = makePlan();
    const b = makePlan();
    b.grades[0].subjects[0].hoursPerClass['5а'] = 5;
    expect(computePlanHash(a)).not.toBe(computePlanHash(b));
  });

  it('different subject name → different hash', () => {
    const a = makePlan();
    const b = makePlan();
    b.grades[0].subjects[0].name = 'Алгебра';
    expect(computePlanHash(a)).not.toBe(computePlanHash(b));
  });

  it('different groupSplit → different hash', () => {
    const a = makePlan();
    const b = makePlan();
    b.grades[0].subjects[0].groupSplit = true;
    expect(computePlanHash(a)).not.toBe(computePlanHash(b));
  });

  it('groupNameOverrides change does NOT change hash', () => {
    const a = makePlan();
    const b = makePlan({ groupNameOverrides: { '5а': { 'Физкультура': ['5а (А)', '5а (Б)'] } } });
    expect(computePlanHash(a)).toBe(computePlanHash(b));
  });

  it('groupCounts change does NOT change hash', () => {
    const a = makePlan();
    const b = makePlan({ groupCounts: { '5а': 1 } });
    expect(computePlanHash(a)).toBe(computePlanHash(b));
  });

  it('grade order change does NOT change hash', () => {
    const plan1: CurriculumPlan = {
      classNames: ['5а', '6а'],
      grades: [
        { grade: 5, subjects: [{ name: 'Математика', shortName: 'Мат', hoursPerClass: { '5а': 4 }, groupSplit: false, part: 'mandatory' as const }] },
        { grade: 6, subjects: [{ name: 'Математика', shortName: 'Мат', hoursPerClass: { '6а': 4 }, groupSplit: false, part: 'mandatory' as const }] },
      ],
    };
    const plan2: CurriculumPlan = {
      classNames: ['5а', '6а'],
      grades: [
        { grade: 6, subjects: [{ name: 'Математика', shortName: 'Мат', hoursPerClass: { '6а': 4 }, groupSplit: false, part: 'mandatory' as const }] },
        { grade: 5, subjects: [{ name: 'Математика', shortName: 'Мат', hoursPerClass: { '5а': 4 }, groupSplit: false, part: 'mandatory' as const }] },
      ],
    };
    expect(computePlanHash(plan1)).toBe(computePlanHash(plan2));
  });

  it('different grade number → different hash', () => {
    const a = makePlan();
    const b: CurriculumPlan = {
      ...makePlan(),
      grades: [{ ...makePlan().grades[0], grade: 6 }],
    };
    expect(computePlanHash(a)).not.toBe(computePlanHash(b));
  });
});
