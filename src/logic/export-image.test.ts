/**
 * Tests for Telegram image export data preparation
 */

import { describe, it, expect } from 'vitest';
import { getChangedClassesData, getTeacherImageData, getAbsentTeachersData } from './export-image';
import type { Schedule, ScheduledLesson, Teacher } from '@/types';

// ─── Fixtures ─────────────────────────────────────────────────

const createLesson = (overrides: Partial<ScheduledLesson> = {}): ScheduledLesson => ({
  id: 'l-1',
  requirementId: 'r-1',
  subject: 'Математика',
  teacher: 'Иванова Т.С.',
  room: '-114-',
  ...overrides,
});

function emptySlots(): Record<number, { lessons: ScheduledLesson[] }> {
  return {
    1: { lessons: [] },
    2: { lessons: [] },
    3: { lessons: [] },
    4: { lessons: [] },
    5: { lessons: [] },
    6: { lessons: [] },
    7: { lessons: [] },
    8: { lessons: [] },
  };
}

// ─── getChangedClassesData ────────────────────────────────────

describe('getChangedClassesData', () => {
  it('returns only columns with changes on the given day', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
      '7б': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
      '11в': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ subject: 'Физика' })] } } },
      '7б': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } }, // unchanged
      '11в': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ teacher: 'Петрова А.П.' })] } } },
    };

    const result = getChangedClassesData(schedule, template, ['5а', '7б', '11в'], 'Пн');

    expect(result.columns).toEqual(['5а', '11в']);
    expect(result.columns).not.toContain('7б');
  });

  it('correctly marks cells as changed/unchanged', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson()] },
          2: { lessons: [createLesson({ id: 'l-2', subject: 'Физика' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ subject: 'Химия' })] }, // changed
          2: { lessons: [createLesson({ id: 'l-2', subject: 'Физика' })] }, // same
        },
      },
    };

    const result = getChangedClassesData(schedule, template, ['5а'], 'Пн');

    expect(result.cells[0][0].isChanged).toBe(true);  // lesson 1 changed
    expect(result.cells[1][0].isChanged).toBe(false);  // lesson 2 unchanged
  });

  it('trims trailing empty rows', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ subject: 'Физика' })] },
          3: { lessons: [createLesson({ id: 'l-3', subject: 'Химия' })] },
          // lessons 4-8 are empty
        },
      },
    };

    const result = getChangedClassesData(schedule, template, ['5а'], 'Пн');

    // Should include rows 1-3, not 4-8
    expect(result.lessonNumbers).toEqual([1, 2, 3]);
    expect(result.cells).toHaveLength(3);
  });

  it('formats cell text with subject, group, teacher, room', () => {
    const template: Schedule = {
      '10а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };
    const schedule: Schedule = {
      '10а': {
        'Пн': {
          ...emptySlots(),
          1: {
            lessons: [createLesson({
              subject: 'Английский',
              teacher: 'Лихачева В.Е.',
              room: '2.6',
              group: '10а(д)',
            })],
          },
        },
      },
    };

    const result = getChangedClassesData(schedule, template, ['10а'], 'Пн');

    expect(result.cells[0][0].text).toBe('Английский (д) Лихачева В.Е. -2.6-');
  });

  it('handles co-teaching (teacher2)', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: {
            lessons: [createLesson({
              subject: 'Физкультура',
              teacher: 'Козлов И.И.',
              teacher2: 'Смирнов А.Н.',
              room: 'зал',
            })],
          },
        },
      },
    };

    const result = getChangedClassesData(schedule, template, ['5а'], 'Пн');

    expect(result.cells[0][0].text).toBe('Физкультура Козлов И.И. / Смирнов А.Н. -зал-');
  });

  it('sorts columns numerically (5а before 11в)', () => {
    const template: Schedule = {
      '11в': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
      '9б': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };
    const schedule: Schedule = {
      '11в': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ subject: 'Физика' })] } } },
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ subject: 'Химия' })] } } },
      '9б': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ subject: 'Биология' })] } } },
    };

    // Pass in alphabetic order (11в first) — should come out numeric
    const result = getChangedClassesData(schedule, template, ['11в', '5а', '9б'], 'Пн');

    expect(result.columns).toEqual(['5а', '9б', '11в']);
  });

  it('returns empty columns array when no classes have changes', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };

    const result = getChangedClassesData(schedule, template, ['5а'], 'Пн');

    expect(result.columns).toEqual([]);
    expect(result.cells).toHaveLength(0);
  });
});

// ─── getTeacherImageData ──────────────────────────────────────

describe('getTeacherImageData', () => {
  const teachers: Record<string, Teacher> = {
    'Иванова Т.С.': { id: 't1', name: 'Иванова Т.С.', bans: {}, subjects: ['Математика'] },
    'Петрова А.П.': { id: 't2', name: 'Петрова А.П.', bans: {}, subjects: ['Физика'] },
    'Козлов И.И.': { id: 't3', name: 'Козлов И.И.', bans: {}, subjects: ['Химия'] },
    'Сидорова Е.Н.': { id: 't4', name: 'Сидорова Е.Н.', bans: {}, subjects: ['Биология'] },
  };

  it('includes teachers with changes, excludes those without', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] },
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Петрова А.П.', subject: 'Физика' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Козлов И.И.', subject: 'Химия' })] }, // changed
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Петрова А.П.', subject: 'Физика' })] }, // same
        },
      },
    };

    const result = getTeacherImageData(schedule, template, teachers, 'Пн', []);

    const changeTeachers = result.changes.map(c => c.teacher);
    expect(changeTeachers).toContain('Козлов И.И.');
    expect(changeTeachers).toContain('Иванова Т.С.'); // was in template's changed slot
    expect(changeTeachers).not.toContain('Петрова А.П.'); // unchanged slot
  });

  it('excludes absent teachers from changes list', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson()] } } },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Козлов И.И.', subject: 'Химия' })] },
        },
      },
    };

    const result = getTeacherImageData(schedule, template, teachers, 'Пн', ['Козлов И.И.']);

    expect(result.changes.map(c => c.teacher)).not.toContain('Козлов И.И.');
  });

  it('includes teachers from REMOVED lessons (template only)', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] },
        },
      },
    };
    // Lesson removed — slot now empty
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [] },
        },
      },
    };

    const result = getTeacherImageData(schedule, template, teachers, 'Пн', []);

    const changeTeachers = result.changes.map(c => c.teacher);
    expect(changeTeachers).toContain('Иванова Т.С.');
  });

  it('shows class names without duplicates', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Козлов И.И.', subject: 'Химия' })] },
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Козлов И.И.', subject: 'Химия' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] },
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Иванова Т.С.' })] },
        },
      },
    };

    const result = getTeacherImageData(schedule, template, teachers, 'Пн', []);

    const kozlov = result.changes.find(c => c.teacher === 'Козлов И.И.');
    expect(kozlov).toBeDefined();
    // Should have '5а' only once despite changes in both lesson 1 and 2
    expect(kozlov!.classes).toEqual(['5а']);
  });

  it('sorts changes alphabetically (Russian locale)', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] },
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Козлов И.И.', subject: 'Химия' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Козлов И.И.', subject: 'Химия' })] },
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Иванова Т.С.' })] },
        },
      },
    };

    const result = getTeacherImageData(schedule, template, teachers, 'Пн', []);

    const changeNames = result.changes.map(c => c.teacher);
    for (let i = 1; i < changeNames.length; i++) {
      expect(changeNames[i - 1].localeCompare(changeNames[i], 'ru')).toBeLessThanOrEqual(0);
    }
  });

  it('includes teacher when only room changed (Z15-2a regression)', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.', room: '-114-' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.', room: '-201-' })] }, // same teacher, different room
        },
      },
    };

    const result = getTeacherImageData(schedule, template, teachers, 'Пн', []);

    const changeTeachers = result.changes.map(c => c.teacher);
    expect(changeTeachers).toContain('Иванова Т.С.');
  });

  it('sorts class names numerically within each teacher', () => {
    const template: Schedule = {
      '11в': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ teacher: 'Козлов И.И.', subject: 'Химия' })] } } },
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ id: 'l-2', teacher: 'Козлов И.И.', subject: 'Химия' })] } } },
    };
    const schedule: Schedule = {
      '11в': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] } } },
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ id: 'l-2', teacher: 'Иванова Т.С.' })] } } },
    };

    const result = getTeacherImageData(schedule, template, teachers, 'Пн', []);

    const kozlov = result.changes.find(c => c.teacher === 'Козлов И.И.');
    expect(kozlov!.classes).toEqual(['5а', '11в']); // numeric order
  });
});

// ─── getAbsentTeachersData ───────────────────────────────────

describe('getAbsentTeachersData', () => {
  const teachers: Record<string, Teacher> = {
    'Иванова Т.С.': { id: 't1', name: 'Иванова Т.С.', bans: {}, subjects: ['Математика'] },
    'Петрова А.П.': { id: 't2', name: 'Петрова А.П.', bans: {}, subjects: ['Физика'] },
    'Сидорова Е.Н.': { id: 't4', name: 'Сидорова Е.Н.', bans: {}, subjects: ['Биология'] },
  };

  it('identifies free teachers (in template but not in weekly)', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] },
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Сидорова Е.Н.', subject: 'Биология' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] },
          2: { lessons: [] },
        },
      },
    };

    const result = getAbsentTeachersData(schedule, template, teachers, 'Пн', []);

    expect(result).toContain('Сидорова Е.Н.');
    expect(result).not.toContain('Иванова Т.С.');
  });

  it('excludes already-absent teachers', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Сидорова Е.Н.', subject: 'Биология' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots() } },
    };

    const result = getAbsentTeachersData(schedule, template, teachers, 'Пн', ['Сидорова Е.Н.']);

    expect(result).not.toContain('Сидорова Е.Н.');
  });

  it('sorts alphabetically (Russian locale)', () => {
    const template: Schedule = {
      '5а': {
        'Пн': {
          ...emptySlots(),
          1: { lessons: [createLesson({ teacher: 'Сидорова Е.Н.', subject: 'Биология' })] },
          2: { lessons: [createLesson({ id: 'l-2', teacher: 'Иванова Т.С.' })] },
        },
      },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots() } },
    };

    const result = getAbsentTeachersData(schedule, template, teachers, 'Пн', []);

    expect(result[0]).toBe('Иванова Т.С.');
    expect(result[1]).toBe('Сидорова Е.Н.');
  });
});

// ─── getTeacherChangesOnDay ────────────────────────────────────

import { getTeacherChangesOnDay } from './export-image';
import { buildTeacherScheduleMap } from './exportMaps';

describe('getTeacherChangesOnDay', () => {
  const teacherNames = ['Иванова Т.С.', 'Петрова А.П.', 'Козлов И.И.'];

  it('includes teacher with a REMOVED lesson (template has lesson, weekly does not)', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] } } },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots() } }, // lesson removed
    };
    const teacherSchedule = buildTeacherScheduleMap(schedule);

    const result = getTeacherChangesOnDay(schedule, template, teacherSchedule, teacherNames, 'Пн');

    expect(result.map(r => r.teacher)).toContain('Иванова Т.С.');
    const entry = result.find(r => r.teacher === 'Иванова Т.С.')!;
    expect(entry.changes).toHaveLength(1);
    expect(entry.changes[0]).toMatchObject({ className: '5а', lessonNum: 1 });
  });

  it('includes teacher with an ADDED lesson (weekly has lesson, template does not)', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots() } },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 2: { lessons: [createLesson({ id: 'l-2', teacher: 'Петрова А.П.', subject: 'Физика' })] } } },
    };
    const teacherSchedule = buildTeacherScheduleMap(schedule);

    const result = getTeacherChangesOnDay(schedule, template, teacherSchedule, teacherNames, 'Пн');

    expect(result.map(r => r.teacher)).toContain('Петрова А.П.');
  });

  it('excludes teacher with no changes on the day', () => {
    const lesson = createLesson({ teacher: 'Козлов И.И.', subject: 'Химия' });
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [lesson] } } },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [lesson] } } }, // same
    };
    const teacherSchedule = buildTeacherScheduleMap(schedule);

    const result = getTeacherChangesOnDay(schedule, template, teacherSchedule, teacherNames, 'Пн');

    expect(result.map(r => r.teacher)).not.toContain('Козлов И.И.');
  });

  it('does not duplicate a slot when teacher appears in both current and template for a changed slot', () => {
    // Teacher is in the current slot (subject changed) — should appear once, not twice
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] } } },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ teacher: 'Иванова Т.С.', subject: 'Физика', id: 'l-x' })] } } },
    };
    const teacherSchedule = buildTeacherScheduleMap(schedule);

    const result = getTeacherChangesOnDay(schedule, template, teacherSchedule, teacherNames, 'Пн');

    const entry = result.find(r => r.teacher === 'Иванова Т.С.')!;
    expect(entry.changes).toHaveLength(1);
  });

  it('returns results sorted alphabetically', () => {
    const template: Schedule = {
      '5а': { 'Пн': { ...emptySlots(), 1: { lessons: [createLesson({ teacher: 'Иванова Т.С.' })] } } },
      '6б': { 'Пн': { ...emptySlots(), 2: { lessons: [createLesson({ id: 'l-2', teacher: 'Козлов И.И.', subject: 'Химия' })] } } },
    };
    const schedule: Schedule = {
      '5а': { 'Пн': { ...emptySlots() } },
      '6б': { 'Пн': { ...emptySlots() } },
    };
    const teacherSchedule = buildTeacherScheduleMap(schedule);

    const result = getTeacherChangesOnDay(schedule, template, teacherSchedule, teacherNames, 'Пн');

    expect(result[0].teacher).toBe('Иванова Т.С.');
    expect(result[1].teacher).toBe('Козлов И.И.');
  });
});
