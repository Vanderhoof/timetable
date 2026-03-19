import { describe, it, expect } from 'vitest';
import { sanpinMaxForClass, sanpinMaxForGrade, SANPIN_MAX, TEACHER_MAX_HOURS } from './sanpin';

describe('sanpinMaxForClass', () => {
  it('returns correct max for grade 5', () => {
    expect(sanpinMaxForClass('5а')).toBe(29);
  });

  it('returns correct max for grade 10', () => {
    expect(sanpinMaxForClass('10б')).toBe(34);
  });

  it('returns correct max for grade 1', () => {
    expect(sanpinMaxForClass('1а')).toBe(21);
  });

  it('returns null for unknown grade', () => {
    expect(sanpinMaxForClass('12а')).toBeNull();
    expect(sanpinMaxForClass('0а')).toBeNull();
  });
});

describe('sanpinMaxForGrade', () => {
  it('returns value from SANPIN_MAX map', () => {
    for (const [grade, max] of Object.entries(SANPIN_MAX)) {
      expect(sanpinMaxForGrade(Number(grade))).toBe(max);
    }
  });

  it('returns null for unknown grade number', () => {
    expect(sanpinMaxForGrade(0)).toBeNull();
    expect(sanpinMaxForGrade(12)).toBeNull();
  });
});

describe('TEACHER_MAX_HOURS', () => {
  it('is 34', () => {
    expect(TEACHER_MAX_HOURS).toBe(34);
  });
});
