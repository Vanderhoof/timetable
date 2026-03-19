/**
 * Tests for cascade rename DB functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LessonRequirement, Version, Substitution } from '@/types';

// vi.mock is hoisted — mockDb must be defined with vi.hoisted so it's available
// at the time the mock factory runs.
const mockDb = vi.hoisted(() => {
  const makeFQ = (initial: unknown[] = []) => ({
    filter: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(initial) }),
    toArray: vi.fn().mockResolvedValue(initial),
    update: vi.fn().mockResolvedValue(undefined),
  });

  return {
    lessonRequirements: makeFQ(),
    teachers: makeFQ(),
    groups: makeFQ(),
    versions: {
      toArray: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('@/db/database', () => ({ db: mockDb }));

// Import after mock setup
import {
  cascadeTeacherRename,
  cascadeRoomRename,
  cascadeClassRename,
  cascadeGroupRenameInVersions,
} from './cascade';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setRequirements(reqs: Partial<LessonRequirement>[]) {
  mockDb.lessonRequirements.filter = vi.fn().mockReturnValue({
    toArray: vi.fn().mockResolvedValue(reqs),
  });
}

function setTeachers(teachers: object[]) {
  mockDb.teachers.filter = vi.fn().mockReturnValue({
    toArray: vi.fn().mockResolvedValue(teachers),
  });
}

function setGroups(groups: object[]) {
  mockDb.groups.filter = vi.fn().mockReturnValue({
    toArray: vi.fn().mockResolvedValue(groups),
  });
}

function setVersions(versions: Partial<Version>[]) {
  mockDb.versions.toArray = vi.fn().mockResolvedValue(versions);
}

function getVersionUpdate(callIndex = 0) {
  return (mockDb.versions.update as ReturnType<typeof vi.fn>).mock.calls[callIndex]?.[1];
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<LessonRequirement> = {}): LessonRequirement {
  return {
    id: 'r-1',
    type: 'class',
    classOrGroup: '10а',
    subject: 'Математика',
    teacher: 'Иванова Т.С.',
    countPerWeek: 5,
    ...overrides,
  };
}

function makeVersion(overrides: Partial<Version> = {}): Partial<Version> {
  return {
    id: 'v-1',
    schedule: {
      '10а': {
        Пн: {
          1: {
            lessons: [
              {
                id: 'l-1',
                requirementId: 'r-1',
                subject: 'Математика',
                teacher: 'Иванова Т.С.',
                room: '-114-',
              },
            ],
          },
        },
      },
    },
    substitutions: [] as Substitution[],
    temporaryLessons: [] as LessonRequirement[],
    ...overrides,
  };
}

// ─── cascadeTeacherRename ─────────────────────────────────────────────────────

describe('cascadeTeacherRename', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates teacher field in lessonRequirements', async () => {
    setRequirements([makeReq({ teacher: 'Иванова Т.С.' })]);
    setVersions([]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    expect(mockDb.lessonRequirements.update).toHaveBeenCalledWith('r-1', {
      teacher: 'Иванова-Смит Т.С.',
    });
  });

  it('updates teacher2 field in lessonRequirements', async () => {
    setRequirements([makeReq({ teacher: 'Козлов И.И.', teacher2: 'Иванова Т.С.' })]);
    setVersions([]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    expect(mockDb.lessonRequirements.update).toHaveBeenCalledWith('r-1', {
      teacher2: 'Иванова-Смит Т.С.',
    });
  });

  it('renames teacher in version schedule blobs', async () => {
    setRequirements([]);
    setVersions([makeVersion()]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    const upd = getVersionUpdate();
    expect(upd.schedule['10а']['Пн'][1].lessons[0].teacher).toBe('Иванова-Смит Т.С.');
  });

  it('renames originalTeacher in version schedule blobs', async () => {
    setRequirements([]);
    setVersions([makeVersion({
      schedule: {
        '10а': {
          Пн: {
            1: {
              lessons: [{
                id: 'l-1', requirementId: 'r-1', subject: 'Математика',
                teacher: 'Козлов И.И.', room: '-114-',
                originalTeacher: 'Иванова Т.С.',
              }],
            },
          },
        },
      },
    })]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    const upd = getVersionUpdate();
    const lesson = upd.schedule['10а']['Пн'][1].lessons[0];
    expect(lesson.originalTeacher).toBe('Иванова-Смит Т.С.');
    expect(lesson.teacher).toBe('Козлов И.И.'); // untouched
  });

  it('renames originalTeacher in version substitutions', async () => {
    setRequirements([]);
    setVersions([makeVersion({
      substitutions: [{
        id: 's-1',
        originalTeacher: 'Иванова Т.С.',
        replacingTeacher: 'Петрова А.П.',
        date: new Date('2026-01-20'),
        day: 'Пн',
        lessonNum: 1,
        classOrGroup: '10а',
        subject: 'Математика',
      }],
    })]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    const upd = getVersionUpdate();
    expect(upd.substitutions[0].originalTeacher).toBe('Иванова-Смит Т.С.');
    expect(upd.substitutions[0].replacingTeacher).toBe('Петрова А.П.'); // unchanged
  });

  it('renames replacingTeacher in version substitutions', async () => {
    setRequirements([]);
    setVersions([makeVersion({
      substitutions: [{
        id: 's-1',
        originalTeacher: 'Козлов И.И.',
        replacingTeacher: 'Иванова Т.С.',
        date: new Date('2026-01-20'),
        day: 'Пн',
        lessonNum: 1,
        classOrGroup: '10а',
        subject: 'Математика',
      }],
    })]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    const upd = getVersionUpdate();
    expect(upd.substitutions[0].replacingTeacher).toBe('Иванова-Смит Т.С.');
  });

  it('renames teacher in version temporaryLessons', async () => {
    setRequirements([]);
    setVersions([makeVersion({
      temporaryLessons: [makeReq({ id: 'tmp-1', teacher: 'Иванова Т.С.' })],
    })]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    const upd = getVersionUpdate();
    expect(upd.temporaryLessons[0].teacher).toBe('Иванова-Смит Т.С.');
  });

  it('does not affect unrelated teachers in schedule', async () => {
    setRequirements([]);
    setVersions([makeVersion({
      schedule: {
        '10б': {
          Пн: {
            1: {
              lessons: [{
                id: 'l-2', requirementId: 'r-2', subject: 'История',
                teacher: 'Козлов И.И.', room: '-228-',
              }],
            },
          },
        },
      },
    })]);

    await cascadeTeacherRename('Иванова Т.С.', 'Иванова-Смит Т.С.');

    const upd = getVersionUpdate();
    expect(upd.schedule['10б']['Пн'][1].lessons[0].teacher).toBe('Козлов И.И.');
  });
});

// ─── cascadeRoomRename ────────────────────────────────────────────────────────

describe('cascadeRoomRename', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates defaultRoom in teachers', async () => {
    setTeachers([{
      id: 't-1', name: 'Иванова Т.С.', subjects: [], bans: {}, defaultRoom: '-114-',
    }]);
    setVersions([]);

    await cascadeRoomRename('-114-', '-214-');

    expect(mockDb.teachers.update).toHaveBeenCalledWith('t-1', { defaultRoom: '-214-' });
  });

  it('renames room in version schedule blobs', async () => {
    setTeachers([]);
    setVersions([makeVersion()]);

    await cascadeRoomRename('-114-', '-214-');

    const upd = getVersionUpdate();
    expect(upd.schedule['10а']['Пн'][1].lessons[0].room).toBe('-214-');
  });

  it('does not touch unrelated rooms', async () => {
    setTeachers([]);
    setVersions([makeVersion()]);

    await cascadeRoomRename('-228-', '-228б-');

    const upd = getVersionUpdate();
    expect(upd.schedule['10а']['Пн'][1].lessons[0].room).toBe('-114-'); // unchanged
  });
});

// ─── cascadeClassRename ───────────────────────────────────────────────────────

describe('cascadeClassRename', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates classOrGroup in type=class requirements', async () => {
    setRequirements([makeReq({ id: 'r-1', type: 'class', classOrGroup: '10а' })]);
    setGroups([]);
    setVersions([]);

    await cascadeClassRename('10а', '10б');

    expect(mockDb.lessonRequirements.update).toHaveBeenCalledWith('r-1', { classOrGroup: '10б' });
  });

  it('updates className in type=group requirements', async () => {
    setRequirements([makeReq({ id: 'r-2', type: 'group', classOrGroup: '10а(д)', className: '10а' })]);
    setGroups([]);
    setVersions([]);

    await cascadeClassRename('10а', '10б');

    expect(mockDb.lessonRequirements.update).toHaveBeenCalledWith('r-2', { className: '10б' });
  });

  it('updates className in groups', async () => {
    setRequirements([]);
    setGroups([{ id: 'g-1', name: '10а(д)', className: '10а', index: '(д)' }]);
    setVersions([]);

    await cascadeClassRename('10а', '10б');

    expect(mockDb.groups.update).toHaveBeenCalledWith('g-1', { className: '10б' });
  });

  it('renames schedule top-level key in versions', async () => {
    setRequirements([]);
    setGroups([]);
    setVersions([makeVersion()]);

    await cascadeClassRename('10а', '10б');

    const upd = getVersionUpdate();
    expect('10б' in upd.schedule).toBe(true);
    expect('10а' in upd.schedule).toBe(false);
  });

  it('renames classOrGroup in version substitutions', async () => {
    setRequirements([]);
    setGroups([]);
    setVersions([makeVersion({
      substitutions: [{
        id: 's-1',
        originalTeacher: 'Иванова Т.С.',
        replacingTeacher: 'Петрова А.П.',
        date: new Date('2026-01-20'),
        day: 'Пн',
        lessonNum: 1,
        classOrGroup: '10а',
        subject: 'Математика',
      }],
    })]);

    await cascadeClassRename('10а', '10б');

    const upd = getVersionUpdate();
    expect(upd.substitutions[0].classOrGroup).toBe('10б');
  });

  it('does not rename unrelated schedule keys', async () => {
    setRequirements([]);
    setGroups([]);
    setVersions([makeVersion({
      schedule: {
        '11а': { Пн: { 1: { lessons: [] } } },
        '10а': { Пн: { 1: { lessons: [] } } },
      },
    })]);

    await cascadeClassRename('10а', '10б');

    const upd = getVersionUpdate();
    expect('11а' in upd.schedule).toBe(true);
    expect('10б' in upd.schedule).toBe(true);
    expect('10а' in upd.schedule).toBe(false);
  });
});

// ─── cascadeGroupRenameInVersions ─────────────────────────────────────────────

describe('cascadeGroupRenameInVersions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renames group index in owning class schedule slots', async () => {
    setVersions([makeVersion({
      schedule: {
        '10а': {
          Пн: {
            1: {
              lessons: [{
                id: 'l-1', requirementId: 'r-1', subject: 'Английский',
                teacher: 'Иванова Т.С.', room: '-114-', group: '(д)',
              }],
            },
          },
        },
      },
    })]);

    await cascadeGroupRenameInVersions('10а(д)', '10а(дев)', '10а', '(д)', '(дев)');

    const upd = getVersionUpdate();
    expect(upd.schedule['10а']['Пн'][1].lessons[0].group).toBe('(дев)');
  });

  it('does not rename group index in other classes', async () => {
    setVersions([makeVersion({
      schedule: {
        '10а': {
          Пн: { 1: { lessons: [{ id: 'l-1', requirementId: 'r-1', subject: 'A', teacher: 'T', room: 'R', group: '(д)' }] } },
        },
        '11а': {
          Пн: { 1: { lessons: [{ id: 'l-2', requirementId: 'r-2', subject: 'B', teacher: 'T', room: 'R', group: '(д)' }] } },
        },
      },
    })]);

    await cascadeGroupRenameInVersions('10а(д)', '10а(дев)', '10а', '(д)', '(дев)');

    const upd = getVersionUpdate();
    expect(upd.schedule['10а']['Пн'][1].lessons[0].group).toBe('(дев)'); // updated
    expect(upd.schedule['11а']['Пн'][1].lessons[0].group).toBe('(д)'); // untouched
  });

  it('renames classOrGroup in version substitutions', async () => {
    setVersions([makeVersion({
      substitutions: [{
        id: 's-1',
        originalTeacher: 'Иванова Т.С.',
        replacingTeacher: 'Петрова А.П.',
        date: new Date('2026-01-20'),
        day: 'Пн',
        lessonNum: 1,
        classOrGroup: '10а(д)',
        subject: 'Английский',
      }],
    })]);

    await cascadeGroupRenameInVersions('10а(д)', '10а(дев)', '10а', '(д)', '(дев)');

    const upd = getVersionUpdate();
    expect(upd.substitutions[0].classOrGroup).toBe('10а(дев)');
  });

  it('skips schedule update when index has not changed', async () => {
    // Only the full group name changed, index stayed the same
    setVersions([makeVersion({
      schedule: {
        '10а': {
          Пн: { 1: { lessons: [{ id: 'l-1', requirementId: 'r-1', subject: 'A', teacher: 'T', room: 'R', group: '(д)' }] } },
        },
      },
    })]);

    await cascadeGroupRenameInVersions('10а(д)', '10б(д)', '10а', '(д)', '(д)');

    const upd = getVersionUpdate();
    expect(upd.schedule['10а']['Пн'][1].lessons[0].group).toBe('(д)'); // unchanged
  });
});
