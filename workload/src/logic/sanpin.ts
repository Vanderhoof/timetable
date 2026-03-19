/**
 * СанПиН max lesson hours per week by grade.
 * Source: СанПиН 1.2.3685-21, Таблица 6.6
 */
export const SANPIN_MAX: Record<number, number> = {
  1: 21,
  2: 23,
  3: 23,
  4: 23,
  5: 29,
  6: 30,
  7: 32,
  8: 33,
  9: 33,
  10: 34,
  11: 34,
};

export const TEACHER_MAX_HOURS = 34;

/** Return the СанПиН max for a class name, e.g. "5а" → 29. Returns null if grade unknown. */
export function sanpinMaxForClass(className: string): number | null {
  const grade = parseInt(className, 10);
  return SANPIN_MAX[grade] ?? null;
}

/** Return the СанПиН max for a grade number. Returns null if unknown. */
export function sanpinMaxForGrade(grade: number): number | null {
  return SANPIN_MAX[grade] ?? null;
}
