/**
 * Tests for schedule manipulation functions
 */

import { describe, it, expect } from 'vitest';
import {
  getSlotLessons,
  isSlotOccupied,
  createEmptySchedule,
  normalizeSchedule,
  addLessonToSlot,
  removeLessonFromSlot,
  updateLessonRoom,
  cloneSchedule,
  schedulesEqual,
  isSlotDifferentFromTemplate,
  hasSlotRoomChange,
  isTeacherSlotChanged,
  computeChangedCells,
  computeTeacherChangedCells,
  replaceLessonInSlot,
} from './schedule';
import type { Schedule, ScheduledLesson, Day } from '@/types';
import { DAYS, LESSON_NUMBERS } from '@/types';

// Test fixtures
const createTestLesson = (overrides: Partial<ScheduledLesson> = {}): ScheduledLesson => ({
  id: 'lesson-1',
  requirementId: 'req-1',
  subject: 'Математика',
  teacher: 'Иванова Т.С.',
  room: '-114-',
  ...overrides,
});

const createTestSchedule = (): Schedule => ({
  '10а': {
    'Пн': {
      1: { lessons: [createTestLesson()] },
      2: { lessons: [] },
      3: { lessons: [] },
      4: { lessons: [] },
      5: { lessons: [] },
      6: { lessons: [] },
      7: { lessons: [] },
      8: { lessons: [] },
    },
  },
});

// Helper to safely access schedule slots in tests
function getSlot(schedule: Schedule, cls: string, day: Day, num: number) {
  return schedule[cls]?.[day]?.[num as 1];
}

describe('getSlotLessons', () => {
  it('returns lessons from existing slot', () => {
    const schedule = createTestSchedule();
    const lessons = getSlotLessons(schedule, '10а', 'Пн', 1);

    expect(lessons).toHaveLength(1);
    expect(lessons[0].subject).toBe('Математика');
  });

  it('returns empty array for non-existent class', () => {
    const schedule = createTestSchedule();
    const lessons = getSlotLessons(schedule, '11б', 'Пн', 1);

    expect(lessons).toEqual([]);
  });

  it('returns empty array for non-existent day', () => {
    const schedule = createTestSchedule();
    const lessons = getSlotLessons(schedule, '10а', 'Сб' as Day, 1);

    expect(lessons).toEqual([]);
  });

  it('returns empty array for empty slot', () => {
    const schedule = createTestSchedule();
    const lessons = getSlotLessons(schedule, '10а', 'Пн', 2);

    expect(lessons).toEqual([]);
  });
});

describe('isSlotOccupied', () => {
  it('returns true for slot with lessons', () => {
    const schedule = createTestSchedule();

    expect(isSlotOccupied(schedule, '10а', 'Пн', 1)).toBe(true);
  });

  it('returns false for empty slot', () => {
    const schedule = createTestSchedule();

    expect(isSlotOccupied(schedule, '10а', 'Пн', 2)).toBe(false);
  });

  it('returns false for non-existent class', () => {
    const schedule = createTestSchedule();

    expect(isSlotOccupied(schedule, '11б', 'Пн', 1)).toBe(false);
  });
});

describe('createEmptySchedule', () => {
  it('creates schedule with all classes', () => {
    const schedule = createEmptySchedule(['10а', '10б'], DAYS, LESSON_NUMBERS);

    expect(Object.keys(schedule)).toEqual(['10а', '10б']);
  });

  it('creates all days for each class', () => {
    const schedule = createEmptySchedule(['10а'], DAYS, LESSON_NUMBERS);

    expect(Object.keys(schedule['10а'])).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']);
  });

  it('creates all lesson slots for each day', () => {
    const schedule = createEmptySchedule(['10а'], DAYS, LESSON_NUMBERS);
    const daySchedule = schedule['10а']['Пн'];

    expect(daySchedule).toBeDefined();
    expect(Object.keys(daySchedule!).map(Number).sort((a, b) => a - b))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('creates empty lesson arrays', () => {
    const schedule = createEmptySchedule(['10а'], DAYS, LESSON_NUMBERS);
    const slot = getSlot(schedule, '10а', 'Пн', 1);

    expect(slot?.lessons).toEqual([]);
  });
});

describe('normalizeSchedule', () => {
  it('fills in missing days', () => {
    const sparse: Schedule = {
      '10а': {
        'Пн': { 1: { lessons: [] } },
      },
    };

    const normalized = normalizeSchedule(sparse, DAYS, LESSON_NUMBERS);

    expect(Object.keys(normalized['10а'])).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']);
  });

  it('fills in missing lesson numbers', () => {
    const sparse: Schedule = {
      '10а': {
        'Пн': { 1: { lessons: [] } },
      },
    };

    const normalized = normalizeSchedule(sparse, DAYS, LESSON_NUMBERS);
    const daySchedule = normalized['10а']['Пн'];

    expect(daySchedule).toBeDefined();
    expect(Object.keys(daySchedule!).map(Number).sort((a, b) => a - b))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('preserves existing lessons', () => {
    const lesson = createTestLesson();
    const sparse: Schedule = {
      '10а': {
        'Пн': { 1: { lessons: [lesson] } },
      },
    };

    const normalized = normalizeSchedule(sparse, DAYS, LESSON_NUMBERS);
    const slot = getSlot(normalized, '10а', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(1);
    expect(slot?.lessons[0].subject).toBe('Математика');
  });
});

describe('addLessonToSlot', () => {
  it('adds lesson to empty slot', () => {
    const schedule = createTestSchedule();
    const newLesson = createTestLesson({ id: 'lesson-2', subject: 'Физика' });

    const result = addLessonToSlot(schedule, '10а', 'Пн', 2, newLesson);
    const slot = getSlot(result, '10а', 'Пн', 2);

    expect(slot?.lessons).toHaveLength(1);
    expect(slot?.lessons[0].subject).toBe('Физика');
  });

  it('appends lesson to slot with existing lessons', () => {
    const schedule = createTestSchedule();
    const newLesson = createTestLesson({ id: 'lesson-2', subject: 'Физика' });

    const result = addLessonToSlot(schedule, '10а', 'Пн', 1, newLesson);
    const slot = getSlot(result, '10а', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(2);
    expect(slot?.lessons[0].subject).toBe('Математика');
    expect(slot?.lessons[1].subject).toBe('Физика');
  });

  it('does not mutate original schedule', () => {
    const schedule = createTestSchedule();
    const originalSlot = getSlot(schedule, '10а', 'Пн', 2);
    const originalLength = originalSlot?.lessons.length ?? 0;
    const newLesson = createTestLesson({ id: 'lesson-2' });

    addLessonToSlot(schedule, '10а', 'Пн', 2, newLesson);
    const afterSlot = getSlot(schedule, '10а', 'Пн', 2);

    expect(afterSlot?.lessons.length).toBe(originalLength);
  });

  it('creates class if not exists', () => {
    const schedule = createTestSchedule();
    const newLesson = createTestLesson();

    const result = addLessonToSlot(schedule, '11б', 'Пн', 1, newLesson);
    const slot = getSlot(result, '11б', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(1);
  });
});

describe('removeLessonFromSlot', () => {
  it('removes lesson at specified index', () => {
    const schedule = createTestSchedule();

    const result = removeLessonFromSlot(schedule, '10а', 'Пн', 1, 0);
    const slot = getSlot(result, '10а', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(0);
  });

  it('returns unchanged schedule for invalid index', () => {
    const schedule = createTestSchedule();

    const result = removeLessonFromSlot(schedule, '10а', 'Пн', 1, 5);
    const slot = getSlot(result, '10а', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(1);
  });

  it('returns unchanged schedule for negative index', () => {
    const schedule = createTestSchedule();

    const result = removeLessonFromSlot(schedule, '10а', 'Пн', 1, -1);
    const slot = getSlot(result, '10а', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(1);
  });

  it('does not mutate original schedule', () => {
    const schedule = createTestSchedule();

    removeLessonFromSlot(schedule, '10а', 'Пн', 1, 0);
    const slot = getSlot(schedule, '10а', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(1);
  });

  it('removes correct lesson when multiple exist', () => {
    let schedule = createTestSchedule();
    schedule = addLessonToSlot(schedule, '10а', 'Пн', 1, createTestLesson({ id: 'lesson-2', subject: 'Физика' }));

    const result = removeLessonFromSlot(schedule, '10а', 'Пн', 1, 0);
    const slot = getSlot(result, '10а', 'Пн', 1);

    expect(slot?.lessons).toHaveLength(1);
    expect(slot?.lessons[0].subject).toBe('Физика');
  });
});

describe('updateLessonRoom', () => {
  it('updates room for lesson at index', () => {
    const schedule = createTestSchedule();

    const result = updateLessonRoom(schedule, '10а', 'Пн', 1, 0, '-205-');
    const slot = getSlot(result, '10а', 'Пн', 1);

    expect(slot?.lessons[0].room).toBe('-205-');
  });

  it('does not mutate original schedule', () => {
    const schedule = createTestSchedule();

    updateLessonRoom(schedule, '10а', 'Пн', 1, 0, '-205-');
    const slot = getSlot(schedule, '10а', 'Пн', 1);

    expect(slot?.lessons[0].room).toBe('-114-');
  });

  it('returns unchanged schedule for invalid index', () => {
    const schedule = createTestSchedule();

    const result = updateLessonRoom(schedule, '10а', 'Пн', 1, 5, '-205-');
    const slot = getSlot(result, '10а', 'Пн', 1);

    expect(slot?.lessons[0].room).toBe('-114-');
  });
});

describe('cloneSchedule', () => {
  it('creates deep copy of schedule', () => {
    const schedule = createTestSchedule();

    const cloned = cloneSchedule(schedule);

    expect(cloned).toEqual(schedule);
    expect(cloned).not.toBe(schedule);
  });

  it('mutations to clone do not affect original', () => {
    const schedule = createTestSchedule();
    const cloned = cloneSchedule(schedule);

    const clonedSlot = getSlot(cloned, '10а', 'Пн', 1);
    if (clonedSlot) {
      clonedSlot.lessons[0].room = '-999-';
    }

    const originalSlot = getSlot(schedule, '10а', 'Пн', 1);
    expect(originalSlot?.lessons[0].room).toBe('-114-');
  });
});

describe('schedulesEqual', () => {
  it('returns true for identical schedules', () => {
    const schedule = createTestSchedule();
    const cloned = cloneSchedule(schedule);

    expect(schedulesEqual(schedule, cloned)).toBe(true);
  });

  it('returns false for different lessons', () => {
    const schedule1 = createTestSchedule();
    const schedule2 = createTestSchedule();
    const slot = getSlot(schedule2, '10а', 'Пн', 1);
    if (slot) {
      slot.lessons[0].subject = 'Физика';
    }

    expect(schedulesEqual(schedule1, schedule2)).toBe(false);
  });

  it('returns false for different number of classes', () => {
    const schedule1 = createTestSchedule();
    const schedule2 = createTestSchedule();
    schedule2['10б'] = {};

    expect(schedulesEqual(schedule1, schedule2)).toBe(false);
  });

  it('returns true for empty schedules', () => {
    expect(schedulesEqual({}, {})).toBe(true);
  });
});

describe('isSlotDifferentFromTemplate', () => {
  it('returns false for identical lessons', () => {
    const current = [createTestLesson()];
    const template = [createTestLesson()];

    expect(isSlotDifferentFromTemplate(current, template)).toBe(false);
  });

  it('returns false for both empty', () => {
    expect(isSlotDifferentFromTemplate([], [])).toBe(false);
  });

  it('returns true when current has lesson but template is empty', () => {
    const current = [createTestLesson()];

    expect(isSlotDifferentFromTemplate(current, [])).toBe(true);
  });

  it('returns true when template has lesson but current is empty', () => {
    const template = [createTestLesson()];

    expect(isSlotDifferentFromTemplate([], template)).toBe(true);
  });

  it('returns true when subjects differ', () => {
    const current = [createTestLesson({ subject: 'Физика' })];
    const template = [createTestLesson({ subject: 'Математика' })];

    expect(isSlotDifferentFromTemplate(current, template)).toBe(true);
  });

  it('returns true when teachers differ', () => {
    const current = [createTestLesson({ teacher: 'Петрова А.П.' })];
    const template = [createTestLesson({ teacher: 'Иванова Т.С.' })];

    expect(isSlotDifferentFromTemplate(current, template)).toBe(true);
  });

  it('ignores room differences', () => {
    const current = [createTestLesson({ room: '-205-' })];
    const template = [createTestLesson({ room: '-114-' })];

    expect(isSlotDifferentFromTemplate(current, template)).toBe(false);
  });

  it('ignores group order (set comparison)', () => {
    const lesson1 = createTestLesson({ id: 'l1', subject: 'Английский', teacher: 'Петрова А.П.' });
    const lesson2 = createTestLesson({ id: 'l2', subject: 'Английский', teacher: 'Сидорова Е.В.' });

    const current = [lesson1, lesson2];
    const template = [lesson2, lesson1]; // reversed order

    expect(isSlotDifferentFromTemplate(current, template)).toBe(false);
  });

  it('detects different number of lessons', () => {
    const current = [createTestLesson()];
    const template = [
      createTestLesson(),
      createTestLesson({ id: 'l2', subject: 'Физика', teacher: 'Петрова А.П.' }),
    ];

    expect(isSlotDifferentFromTemplate(current, template)).toBe(true);
  });

  it('distinguishes group lessons with same subject and teacher', () => {
    const current = [
      createTestLesson({ id: 'l1', subject: 'Английский', teacher: 'Иванова Т.С.', group: '10а(д)' }),
    ];
    const template = [
      createTestLesson({ id: 'l2', subject: 'Английский', teacher: 'Иванова Т.С.', group: '10а(е)' }),
    ];

    // Different groups — should be detected as different
    expect(isSlotDifferentFromTemplate(current, template)).toBe(true);
  });

  it('considers identical group lessons as same', () => {
    const current = [
      createTestLesson({ id: 'l1', subject: 'Английский', teacher: 'Иванова Т.С.', group: '10а(д)' }),
    ];
    const template = [
      createTestLesson({ id: 'l2', subject: 'Английский', teacher: 'Иванова Т.С.', group: '10а(д)' }),
    ];

    expect(isSlotDifferentFromTemplate(current, template)).toBe(false);
  });
});

describe('replaceLessonInSlot', () => {
  it('replaces lesson at the given index', () => {
    const schedule = createTestSchedule();
    const newLesson = createTestLesson({ id: 'new-1', subject: 'Физика', teacher: 'Петрова А.П.' });

    const result = replaceLessonInSlot(schedule, '10а', 'Пн', 1, 0, newLesson);

    const lessons = getSlotLessons(result, '10а', 'Пн', 1);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].subject).toBe('Физика');
    expect(lessons[0].teacher).toBe('Петрова А.П.');
  });

  it('returns original schedule for out-of-bounds index', () => {
    const schedule = createTestSchedule();
    const newLesson = createTestLesson({ id: 'new-1' });

    const result = replaceLessonInSlot(schedule, '10а', 'Пн', 1, 5, newLesson);
    expect(result).toBe(schedule);
  });

  it('returns original schedule for negative index', () => {
    const schedule = createTestSchedule();
    const newLesson = createTestLesson({ id: 'new-1' });

    const result = replaceLessonInSlot(schedule, '10а', 'Пн', 1, -1, newLesson);
    expect(result).toBe(schedule);
  });

  it('does not mutate the original schedule', () => {
    const schedule = createTestSchedule();
    const originalSubject = getSlotLessons(schedule, '10а', 'Пн', 1)[0].subject;
    const newLesson = createTestLesson({ id: 'new-1', subject: 'Химия' });

    replaceLessonInSlot(schedule, '10а', 'Пн', 1, 0, newLesson);

    expect(getSlotLessons(schedule, '10а', 'Пн', 1)[0].subject).toBe(originalSubject);
  });

  it('replaces correct lesson when slot has multiple lessons', () => {
    const lesson1 = createTestLesson({ id: 'l1', subject: 'Английский', group: '10а(д)' });
    const lesson2 = createTestLesson({ id: 'l2', subject: 'Английский', group: '10а(е)', teacher: 'Петрова А.П.' });
    const schedule: Schedule = {
      '10а': {
        'Пн': {
          1: { lessons: [lesson1, lesson2] },
        },
      },
    };
    const replacement = createTestLesson({ id: 'new', subject: 'Французский', group: '10а(е)', teacher: 'Сидорова Е.В.' });

    const result = replaceLessonInSlot(schedule, '10а', 'Пн', 1, 1, replacement);

    const lessons = getSlotLessons(result, '10а', 'Пн', 1);
    expect(lessons).toHaveLength(2);
    expect(lessons[0].subject).toBe('Английский');
    expect(lessons[1].subject).toBe('Французский');
    expect(lessons[1].teacher).toBe('Сидорова Е.В.');
  });
});

// ─── hasSlotRoomChange ────────────────────────────────────────

describe('hasSlotRoomChange', () => {
  const base = createTestLesson({ subject: 'Математика', teacher: 'Иванова Т.С.', room: '-114-' });

  it('returns false when rooms are identical', () => {
    expect(hasSlotRoomChange([base], [base])).toBe(false);
  });

  it('returns true when same teacher+subject+group but different room', () => {
    const changed = { ...base, room: '-201-' };
    expect(hasSlotRoomChange([changed], [base])).toBe(true);
  });

  it('returns false when lesson is added (no matching template lesson)', () => {
    const extra = createTestLesson({ subject: 'Физика', teacher: 'Петрова А.П.', room: '-110-' });
    expect(hasSlotRoomChange([base, extra], [base])).toBe(false);
  });

  it('returns false when teacher changed (structural change, not room change)', () => {
    const newTeacher = { ...base, teacher: 'Козлов И.И.' };
    expect(hasSlotRoomChange([newTeacher], [base])).toBe(false);
  });

  it('returns true only for the lesson whose room changed when multiple lessons in slot', () => {
    const lesson2 = createTestLesson({ id: 'l-2', subject: 'Физика', teacher: 'Петрова А.П.', room: '-110-' });
    const lesson2Changed = { ...lesson2, room: '-305-' };
    expect(hasSlotRoomChange([base, lesson2Changed], [base, lesson2])).toBe(true);
    expect(hasSlotRoomChange([base, lesson2], [base, lesson2])).toBe(false);
  });
});

// ─── computeChangedCells (Z20-1 regression) ───────────────────

describe('computeChangedCells', () => {
  const makeSchedule = (className: string, day: Day, lessonNum: number, lessons: ScheduledLesson[]): Schedule => ({
    [className]: { [day]: { [lessonNum]: { lessons } } },
  });

  const опдTemplate = createTestLesson({ subject: 'ОПД', teacher: 'Бебешина Н.М.', room: '-203-' });
  const опдRoomChanged = { ...опдTemplate, room: '-2.2-' };
  const разговорыLesson = createTestLesson({ subject: 'Разговоры', teacher: 'Погосян А.Р.', room: '-121-' });

  it('returns empty set when no template', () => {
    const result = computeChangedCells({}, {}, ['9г']);
    expect(result.size).toBe(0);
  });

  it('returns empty set when schedule matches template exactly', () => {
    const sched = makeSchedule('9г', 'Пн', 2, [опдTemplate]);
    const result = computeChangedCells(sched, sched, ['9г']);
    expect(result.size).toBe(0);
  });

  it('detects structural change (different subject+teacher)', () => {
    const template = makeSchedule('9б', 'Пн', 1, [разговорыLesson]);
    const current = makeSchedule('9б', 'Пн', 1, [опдTemplate]);
    const result = computeChangedCells(current, template, ['9б']);
    expect(result.has('9б|Пн|1')).toBe(true);
  });

  it('detects new lesson (slot empty in template)', () => {
    const template = makeSchedule('9б', 'Пн', 8, []);
    const current = makeSchedule('9б', 'Пн', 8, [разговорыLesson]);
    const result = computeChangedCells(current, template, ['9б']);
    expect(result.has('9б|Пн|8')).toBe(true);
  });

  it('detects removed lesson (slot empty in weekly)', () => {
    const template = makeSchedule('9б', 'Пн', 4, [опдTemplate]);
    const current = makeSchedule('9б', 'Пн', 4, []);
    const result = computeChangedCells(current, template, ['9б']);
    expect(result.has('9б|Пн|4')).toBe(true);
  });

  it('detects room-only change — Z20-1 regression (9г lesson 2: -203- → -2.2-)', () => {
    const template = makeSchedule('9г', 'Пн', 2, [опдTemplate]);
    const current = makeSchedule('9г', 'Пн', 2, [опдRoomChanged]);
    const result = computeChangedCells(current, template, ['9г']);
    expect(result.has('9г|Пн|2')).toBe(true);
  });

  it('detects room-only change — Z20-1 regression (9в lesson 5: -220- → -323-)', () => {
    const опд220 = createTestLesson({ subject: 'ОПД', teacher: 'Бебешина Н.М.', room: '-220-' });
    const опд323 = { ...опд220, room: '-323-' };
    const template = makeSchedule('9в', 'Пн', 5, [опд220]);
    const current = makeSchedule('9в', 'Пн', 5, [опд323]);
    const result = computeChangedCells(current, template, ['9в']);
    expect(result.has('9в|Пн|5')).toBe(true);
  });

  it('does not flag identical slots as changed', () => {
    const template = makeSchedule('9д', 'Пн', 3, [опдTemplate]);
    const current = makeSchedule('9д', 'Пн', 3, [опдTemplate]);
    const result = computeChangedCells(current, template, ['9д']);
    expect(result.has('9д|Пн|3')).toBe(false);
  });

  it('only checks classNames passed in — ignores extra classes in schedule', () => {
    const template = makeSchedule('9г', 'Пн', 2, [опдTemplate]);
    const current = makeSchedule('9г', 'Пн', 2, [опдRoomChanged]);
    // Pass empty classNames — should find nothing even though data differs
    const result = computeChangedCells(current, template, []);
    expect(result.size).toBe(0);
  });
});

// ─── isTeacherSlotChanged (QI-7) ───────────────────────────────

describe('isTeacherSlotChanged', () => {
  const teacherA = createTestLesson({ teacher: 'Иванова Т.С.', room: '-114-', group: '10а(д)' });
  const teacherB = createTestLesson({ id: 'l-2', teacher: 'Петрова А.П.', room: '-115-', group: '10а(м)' });

  it('returns false when teacher lesson is identical in both slots', () => {
    const slot = [teacherA, teacherB];
    expect(isTeacherSlotChanged(slot, slot, 'Иванова Т.С.')).toBe(false);
  });

  it('returns true when teacher lesson has a room change', () => {
    const current = [{ ...teacherA, room: '-201-' }, teacherB];
    const template = [teacherA, teacherB];
    expect(isTeacherSlotChanged(current, template, 'Иванова Т.С.')).toBe(true);
  });

  it('returns false for teacher B when only teacher A changed room (QI-7 regression)', () => {
    const current = [{ ...teacherA, room: '-201-' }, teacherB];
    const template = [teacherA, teacherB];
    // Teacher B is unchanged — must NOT be flagged
    expect(isTeacherSlotChanged(current, template, 'Петрова А.П.')).toBe(false);
  });

  it('returns true when teacher lesson is structurally different', () => {
    const current = [{ ...teacherA, subject: 'Физика' }, teacherB];
    const template = [teacherA, teacherB];
    expect(isTeacherSlotChanged(current, template, 'Иванова Т.С.')).toBe(true);
  });

  it('returns true when teacher lesson is removed from current', () => {
    const current = [teacherB]; // teacherA removed
    const template = [teacherA, teacherB];
    expect(isTeacherSlotChanged(current, template, 'Иванова Т.С.')).toBe(true);
  });

  it('returns false when teacher has no lesson in either slot (empty → empty)', () => {
    expect(isTeacherSlotChanged([], [], 'Иванова Т.С.')).toBe(false);
  });

  it('handles teacher2 field correctly', () => {
    const withTeacher2 = { ...teacherA, teacher: 'Козлов И.И.', teacher2: 'Иванова Т.С.' };
    const current = [{ ...withTeacher2, room: '-202-' }];
    const template = [withTeacher2];
    expect(isTeacherSlotChanged(current, template, 'Иванова Т.С.')).toBe(true);
  });
});

// ─── computeTeacherChangedCells (QI-7 / QI-10) ────────────────

describe('computeTeacherChangedCells', () => {
  const makeSchedule = (className: string, day: Day, lessonNum: number, lessons: ScheduledLesson[]): Schedule => ({
    [className]: { [day]: { [lessonNum]: { lessons } } },
  });

  const lessonA = createTestLesson({ teacher: 'Иванова Т.С.', room: '-114-', group: '10а(д)' });
  const lessonB = createTestLesson({ id: 'l-2', teacher: 'Петрова А.П.', room: '-115-', group: '10а(м)' });

  it('returns empty set when no changes', () => {
    const sched = makeSchedule('10а', 'Пн', 1, [lessonA, lessonB]);
    expect(computeTeacherChangedCells(sched, sched, ['10а']).size).toBe(0);
  });

  it('returns empty set when both schedule and template are empty', () => {
    expect(computeTeacherChangedCells({}, {}, ['10а']).size).toBe(0);
  });

  it('flags teacher A when their room changes, not teacher B (QI-7 core case)', () => {
    const template = makeSchedule('10а', 'Пн', 1, [lessonA, lessonB]);
    const current = makeSchedule('10а', 'Пн', 1, [{ ...lessonA, room: '-201-' }, lessonB]);
    const result = computeTeacherChangedCells(current, template, ['10а']);
    expect(result.has('Иванова Т.С.|10а|Пн|1')).toBe(true);
    expect(result.has('Петрова А.П.|10а|Пн|1')).toBe(false);
  });

  it('flags both teachers when both lessons change', () => {
    const template = makeSchedule('10а', 'Пн', 1, [lessonA, lessonB]);
    const current = makeSchedule('10а', 'Пн', 1, [{ ...lessonA, room: '-201-' }, { ...lessonB, room: '-202-' }]);
    const result = computeTeacherChangedCells(current, template, ['10а']);
    expect(result.has('Иванова Т.С.|10а|Пн|1')).toBe(true);
    expect(result.has('Петрова А.П.|10а|Пн|1')).toBe(true);
  });

  it('only checks classNames passed in', () => {
    const template = makeSchedule('10а', 'Пн', 1, [lessonA]);
    const current = makeSchedule('10а', 'Пн', 1, [{ ...lessonA, room: '-201-' }]);
    expect(computeTeacherChangedCells(current, template, []).size).toBe(0);
  });
});
