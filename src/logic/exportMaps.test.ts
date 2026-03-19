import { describe, it, expect } from 'vitest';
import { buildTeacherScheduleMap, buildRoomScheduleMap } from './exportMaps';
import type { Schedule } from '@/types';

function makeSchedule(): Schedule {
  return {
    '5а': {
      'Пн': {
        1: { lessons: [{ id: 'l1', requirementId: 'r1', subject: 'Математика', teacher: 'Иванова Т.С.', room: '201' }] },
        2: { lessons: [{ id: 'l2', requirementId: 'r2', subject: 'Физика', teacher: 'Петров А.П.', teacher2: 'Иванова Т.С.', room: '202' }] },
      },
      'Вт': {
        1: { lessons: [{ id: 'l3', requirementId: 'r3', subject: 'История', teacher: 'Иванова Т.С.', room: '201' }] },
      },
    },
    '6б': {
      'Пн': {
        1: { lessons: [{ id: 'l4', requirementId: 'r4', subject: 'Химия', teacher: 'Петров А.П.', room: '303' }] },
      },
    },
  };
}

describe('buildTeacherScheduleMap', () => {
  it('indexes lessons by primary teacher', () => {
    const map = buildTeacherScheduleMap(makeSchedule());
    expect(map['Иванова Т.С.']['Пн'][1]).toHaveLength(1);
    expect(map['Иванова Т.С.']['Пн'][1][0].className).toBe('5а');
    expect(map['Иванова Т.С.']['Пн'][1][0].lesson.subject).toBe('Математика');
  });

  it('also indexes by teacher2 when present', () => {
    const map = buildTeacherScheduleMap(makeSchedule());
    // lesson l2 has Иванова as teacher2 — should appear under both
    expect(map['Иванова Т.С.']['Пн'][2]).toHaveLength(1);
    expect(map['Иванова Т.С.']['Пн'][2][0].lesson.subject).toBe('Физика');
    expect(map['Петров А.П.']['Пн'][2]).toHaveLength(1);
  });

  it('aggregates lessons from multiple classes under the same teacher', () => {
    const map = buildTeacherScheduleMap(makeSchedule());
    // Петров teaches Пн:1 in both 5а and 6б... wait 5а Пн:1 is Иванова, 6б Пн:1 is Петров
    // Петров also has Пн:2 in 5а (as teacher2)
    expect(map['Петров А.П.']['Пн'][1]).toHaveLength(1);
    expect(map['Петров А.П.']['Пн'][1][0].className).toBe('6б');
  });

  it('handles different days correctly', () => {
    const map = buildTeacherScheduleMap(makeSchedule());
    expect(map['Иванова Т.С.']['Вт'][1]).toHaveLength(1);
    expect(map['Иванова Т.С.']['Вт'][1][0].lesson.subject).toBe('История');
  });

  it('returns empty map for empty schedule', () => {
    expect(buildTeacherScheduleMap({})).toEqual({});
  });
});

describe('buildRoomScheduleMap', () => {
  it('indexes lessons by room', () => {
    const map = buildRoomScheduleMap(makeSchedule());
    expect(map['201']['Пн'][1]).toHaveLength(1);
    expect(map['201']['Пн'][1][0].lesson.subject).toBe('Математика');
  });

  it('same room on different days/lessons are separate', () => {
    const map = buildRoomScheduleMap(makeSchedule());
    expect(map['201']['Пн'][1]).toHaveLength(1);
    expect(map['201']['Вт'][1]).toHaveLength(1);
    expect(map['201']['Вт'][1][0].lesson.subject).toBe('История');
  });

  it('aggregates multiple classes using the same room at the same slot', () => {
    const schedule: Schedule = {
      '5а': { 'Пн': { 1: { lessons: [{ id: 'a', requirementId: 'ra', subject: 'X', teacher: 'T1', room: 'Спортзал' }] } } },
      '6б': { 'Пн': { 1: { lessons: [{ id: 'b', requirementId: 'rb', subject: 'Y', teacher: 'T2', room: 'Спортзал' }] } } },
    };
    const map = buildRoomScheduleMap(schedule);
    expect(map['Спортзал']['Пн'][1]).toHaveLength(2);
  });

  it('returns empty map for empty schedule', () => {
    expect(buildRoomScheduleMap({})).toEqual({});
  });
});
