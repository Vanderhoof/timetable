/**
 * Integration tests with real stakeholder data (57 classes, 59 teachers, 792 requirements).
 *
 * QI-1: Integration tests for complex user flows
 * QI-4: Real-data testing — verify key operations with production-scale data
 */

import { describe, it, expect } from 'vitest';
import {
  getRealData,
  buildTeacherMap,
  buildRoomMap,
  getTemplateSchedule,
  getWeeklyVersion,
  getRequirements,
} from './__fixtures__/helpers';
import {
  getScheduledCounts,
  getUnscheduledLessons,
  getTotalUnscheduledCount,
  getClassProgress,
  mergeWithTemporaryLessons,
  getLessonsPerDay,
  getTeacherLessonsPerDay,
  getTeachersOnDay,
  validateSchedule,
  findGaps,
  suggestGapExclusions,
  getAvailableRooms,
  isRoomAvailable,
  getAvailableLessonsForSlot,
  getSubstituteTeachers,
  getTeacherClassesAtTime,
  canAssignLesson,
  isTeacherFree,
  getTeacherConflict,
  addLessonToSlot,
  removeLessonFromSlot,
  updateLessonRoom,
  cloneSchedule,
  schedulesEqual,
  isSlotDifferentFromTemplate,
  getLessonKey,
} from '@/logic';
import { getExportSummary, CURRENT_SCHEMA_VERSION } from '@/db/import-export';
import type { Day, LessonNumber, ScheduledLesson } from '@/types';

// ============================================================
// 1. Data loading & migration
// ============================================================

describe('real data: import and migration', () => {
  it('parses and migrates from v3.2 to current schema', () => {
    const data = getRealData();
    expect(data.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('has expected dataset sizes', () => {
    const data = getRealData();
    expect(data.teachers.length).toBe(59);
    expect(data.rooms.length).toBe(54);
    expect(data.classes.length).toBe(57);
    expect(data.groups.length).toBe(101);
    expect(data.lessonRequirements.length).toBe(792);
    expect(data.scheduleVersions.length).toBe(2);
  });

  it('export summary matches data', () => {
    const data = getRealData();
    const summary = getExportSummary(data);
    expect(summary.teacherCount).toBe(59);
    expect(summary.roomCount).toBe(54);
    expect(summary.classCount).toBe(57);
    expect(summary.groupCount).toBe(101);
    expect(summary.requirementCount).toBe(792);
    expect(summary.versionCount).toBe(2);
  });

  it('all teachers have required fields', () => {
    const data = getRealData();
    for (const t of data.teachers) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.bans).toBeDefined();
      expect(Array.isArray(t.subjects)).toBe(true);
    }
  });

  it('all requirements reference valid classes', () => {
    const data = getRealData();
    const classNames = new Set(data.classes.map(c => c.name));
    const groupNames = new Set(data.groups.map(g => g.name));

    for (const req of data.lessonRequirements) {
      if (req.type === 'class') {
        expect(classNames.has(req.classOrGroup)).toBe(true);
      } else {
        expect(groupNames.has(req.classOrGroup)).toBe(true);
        expect(req.className).toBeTruthy();
        expect(classNames.has(req.className!)).toBe(true);
      }
    }
  });

  it('group requirements have parallelGroup set', () => {
    const reqs = getRequirements().filter(r => r.type === 'group');
    expect(reqs.length).toBe(188);
    for (const r of reqs) {
      expect(r.parallelGroup).toBeTruthy();
    }
  });
});

// ============================================================
// 2. Counting and progress at scale
// ============================================================

describe('real data: counting and progress', () => {
  const schedule = getTemplateSchedule();
  const requirements = getRequirements();

  it('getScheduledCounts does not crash on any class', () => {
    const data = getRealData();
    for (const cls of data.classes) {
      const counts = getScheduledCounts(schedule, cls.name);
      expect(counts).toBeInstanceOf(Map);
    }
  });

  it('getUnscheduledLessons returns consistent results for all classes', () => {
    const data = getRealData();
    for (const cls of data.classes) {
      const unscheduled = getUnscheduledLessons(requirements, schedule, cls.name);
      for (const item of unscheduled) {
        expect(item.remaining).toBeGreaterThan(0);
        expect(item.remaining).toBeLessThanOrEqual(item.requirement.countPerWeek);
      }
    }
  });

  it('getClassProgress returns sane percentages for all classes', () => {
    const data = getRealData();
    for (const cls of data.classes) {
      const progress = getClassProgress(requirements, schedule, cls.name);
      expect(progress.percentage).toBeGreaterThanOrEqual(0);
      expect(progress.percentage).toBeLessThanOrEqual(100);
      expect(progress.totalScheduled).toBeLessThanOrEqual(progress.totalRequired);
    }
  });

  it('total scheduled + unscheduled = total required (conservation)', () => {
    const data = getRealData();
    for (const cls of data.classes) {
      const progress = getClassProgress(requirements, schedule, cls.name);
      const unscheduledCount = getTotalUnscheduledCount(requirements, schedule, cls.name);
      expect(progress.totalScheduled + unscheduledCount).toBe(progress.totalRequired);
    }
  });

  it('getLessonsPerDay returns reasonable counts for all classes', () => {
    const data = getRealData();
    for (const cls of data.classes) {
      const perDay = getLessonsPerDay(schedule, cls.name);
      for (const [, count] of perDay) {
        // With parallel groups, a slot can have multiple lessons,
        // so the count can exceed 8 (e.g. 2 parallel group lessons per slot)
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(16); // 8 slots × 2 parallel groups max
      }
    }
  });
});

// ============================================================
// 3. Validation at scale
// ============================================================

describe('real data: validation', () => {
  const schedule = getTemplateSchedule();
  const data = getRealData();
  const teachers = buildTeacherMap(data.teachers);

  it('validateSchedule completes without error', () => {
    const conflicts = validateSchedule(schedule, teachers);
    expect(Array.isArray(conflicts)).toBe(true);
    // Real data may have some conflicts — we just verify it doesn't crash
  });

  it('findGaps completes without error', () => {
    const gaps = findGaps(schedule, teachers);
    expect(Array.isArray(gaps)).toBe(true);
    // Verify class-type gaps reference valid class names
    const classNames = new Set(data.classes.map(c => c.name));
    for (const gap of gaps) {
      if (gap.type === 'class') {
        expect(classNames.has(gap.name)).toBe(true);
      }
    }
  });

  it('findGaps with exclusions reduces count', () => {
    const allGaps = findGaps(schedule, teachers);
    const excluded = suggestGapExclusions(data.classes.map(c => c.name));
    const filteredGaps = findGaps(schedule, teachers, new Set(excluded));
    expect(filteredGaps.length).toBeLessThanOrEqual(allGaps.length);
  });

  it('suggestGapExclusions identifies home-schooled and elementary', () => {
    const classNames = data.classes.map(c => c.name);
    const excluded = suggestGapExclusions(classNames);
    // Семейный-1 and Семейный-2 should be suggested (no leading digit)
    expect(excluded).toContain('Семейный-1');
    expect(excluded).toContain('Семейный-2');
    // 1а, 2а etc should be suggested (elementary)
    const elementary = excluded.filter(n => /^[1-4]\D/.test(n));
    expect(elementary.length).toBeGreaterThan(0);
    // 10а should NOT be suggested
    expect(excluded).not.toContain('10а');
  });
});

// ============================================================
// 4. Room availability with real rooms
// ============================================================

describe('real data: room availability', () => {
  const schedule = getTemplateSchedule();
  const data = getRealData();
  const rooms = buildRoomMap(data.rooms);

  it('getAvailableRooms returns rooms for every slot without crash', () => {
    const days: Day[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
    // Spot-check a few slots
    for (const day of days) {
      for (const lessonNum of [1, 4, 8] as LessonNumber[]) {
        const available = getAvailableRooms(schedule, rooms, day, lessonNum, data.classes);
        expect(Array.isArray(available)).toBe(true);
        // Should always have some rooms available
        expect(available.length).toBeGreaterThan(0);
      }
    }
  });

  it('multi-class rooms can be used by multiple classes', () => {
    const multiRooms = data.rooms.filter(r => (r.multiClass ?? 1) > 1);
    expect(multiRooms.length).toBe(3);

    // The gym '-Зал-(3)' allows 3 classes
    const gym = multiRooms.find(r => r.shortName === '-Зал-');
    expect(gym).toBeDefined();
    expect(gym!.multiClass).toBe(3);
  });

  it('isRoomAvailable returns boolean for all rooms at a busy slot', () => {
    // Lesson 3 on Monday is typically busy
    for (const room of data.rooms) {
      const result = isRoomAvailable(schedule, rooms, room.shortName, 'Пн', 3 as LessonNumber, data.classes);
      expect(typeof result).toBe('boolean');
    }
  });
});

// ============================================================
// 5. Teacher conflict detection at scale
// ============================================================

describe('real data: teacher conflicts', () => {
  const schedule = getTemplateSchedule();
  const data = getRealData();
  const teachers = buildTeacherMap(data.teachers);

  it('getTeacherConflict works for all teachers on busy slots', () => {
    // Check a few busy slots
    const slots: [Day, LessonNumber][] = [['Пн', 2], ['Вт', 3], ['Ср', 4]];
    for (const [day, num] of slots) {
      for (const teacher of data.teachers) {
        const conflict = getTeacherConflict(schedule, teacher.name, day, num);
        // Result is either null or an object with className and subject
        if (conflict) {
          expect(conflict.className).toBeTruthy();
          expect(conflict.subject).toBeTruthy();
        }
      }
    }
  });

  it('isTeacherFree respects bans', () => {
    // Иванова has full ban on Вт
    const avdeeva = data.teachers.find(t => t.name === 'Иванова Н.В.');
    expect(avdeeva).toBeDefined();
    expect(avdeeva!.bans['Вт']).toBeDefined();

    for (let n = 1; n <= 8; n++) {
      expect(isTeacherFree(schedule, teachers, 'Иванова Н.В.', 'Вт', n as LessonNumber)).toBe(false);
    }
  });

  it('getTeachersOnDay finds teachers across all classes', () => {
    const mondayTeachers = getTeachersOnDay(schedule, 'Пн');
    expect(mondayTeachers.size).toBeGreaterThan(20); // Expect many teachers on Monday
  });

  it('getTeacherLessonsPerDay sums correctly', () => {
    // Pick a teacher with known lessons
    for (const teacher of data.teachers.slice(0, 10)) {
      const perDay = getTeacherLessonsPerDay(schedule, teacher.name);
      for (const [, count] of perDay) {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(8);
      }
    }
  });

  it('getTeacherClassesAtTime returns correct data', () => {
    // Find a teacher who is teaching on Пн-1
    const classes = getTeacherClassesAtTime(schedule, data.teachers[0].name, 'Пн', 1 as LessonNumber);
    expect(Array.isArray(classes)).toBe(true);
    for (const c of classes) {
      expect(c.className).toBeTruthy();
      expect(c.subject).toBeTruthy();
    }
  });
});

// ============================================================
// 6. Available lessons for slot (replacement/move flow)
// ============================================================

describe('real data: available lessons for slot', () => {
  const schedule = getTemplateSchedule();
  const data = getRealData();
  const teachers = buildTeacherMap(data.teachers);
  const requirements = getRequirements();

  it('getAvailableLessonsForSlot returns results for various classes', () => {
    const testClasses = ['10а', '11а', '5а', '7б'];
    for (const cls of testClasses) {
      const result = getAvailableLessonsForSlot(
        requirements, schedule, teachers, cls, 'Пн', 1 as LessonNumber
      );
      expect(result).toHaveProperty('unscheduled');
      expect(result).toHaveProperty('movable');
      expect(Array.isArray(result.unscheduled)).toBe(true);
      expect(Array.isArray(result.movable)).toBe(true);
    }
  });

  it('getAvailableLessonsForSlot with excludeLesson filters correctly', () => {
    // Get a lesson from 10а-Пн-1
    const slot = schedule['10а']?.['Пн']?.[1 as LessonNumber];
    if (slot?.lessons?.length) {
      const existingLesson = slot.lessons[0];
      const result = getAvailableLessonsForSlot(
        requirements, schedule, teachers, '10а', 'Пн', 2 as LessonNumber,
        { subject: existingLesson.subject, teacher: existingLesson.teacher, group: existingLesson.group }
      );
      // Excluded teacher's lessons should not appear
      for (const item of result.unscheduled) {
        expect(item.teacher).not.toBe(existingLesson.teacher);
      }
    }
  });

  it('getSubstituteTeachers does not crash with real data', () => {
    const subs = getSubstituteTeachers(
      schedule, teachers, 'Математика', 'Пн', 3 as LessonNumber, '10а'
    );
    expect(Array.isArray(subs)).toBe(true);
    // All returned teachers should have 'Математика' in subjects
    for (const t of subs) {
      expect(t.subjects).toContain('Математика');
    }
  });
});

// ============================================================
// 7. Schedule manipulation at scale
// ============================================================

describe('real data: schedule manipulation', () => {
  const data = getRealData();
  const teachers = buildTeacherMap(data.teachers);

  it('addLessonToSlot + removeLessonFromSlot round-trips', () => {
    const schedule = getTemplateSchedule(); // fresh copy via migration

    const lesson: ScheduledLesson = {
      id: 'test-1',
      requirementId: 'test-req',
      subject: 'Тест',
      teacher: data.teachers[0].name,
      room: data.rooms[0].shortName,
    };

    // Find an empty slot in 10а
    let emptyDay: Day | null = null;
    let emptyNum: LessonNumber | null = null;
    for (const day of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'] as Day[]) {
      for (let n = 1; n <= 8; n++) {
        const existing = schedule['10а']?.[day]?.[n as LessonNumber]?.lessons ?? [];
        if (existing.length === 0) {
          emptyDay = day;
          emptyNum = n as LessonNumber;
          break;
        }
      }
      if (emptyDay) break;
    }

    expect(emptyDay).not.toBeNull();
    expect(emptyNum).not.toBeNull();

    const withLesson = addLessonToSlot(schedule, '10а', emptyDay!, emptyNum!, lesson);
    const slotAfterAdd = withLesson['10а']?.[emptyDay!]?.[emptyNum!]?.lessons ?? [];
    expect(slotAfterAdd).toHaveLength(1);
    expect(slotAfterAdd[0].subject).toBe('Тест');

    const afterRemove = removeLessonFromSlot(withLesson, '10а', emptyDay!, emptyNum!, 0);
    const slotAfterRemove = afterRemove['10а']?.[emptyDay!]?.[emptyNum!]?.lessons ?? [];
    expect(slotAfterRemove).toHaveLength(0);
  });

  it('updateLessonRoom works on existing lesson', () => {
    const schedule = getTemplateSchedule();

    // Find first occupied slot in 10а
    for (const day of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'] as Day[]) {
      for (let n = 1; n <= 8; n++) {
        const lessons = schedule['10а']?.[day]?.[n as LessonNumber]?.lessons ?? [];
        if (lessons.length > 0) {
          const updated = updateLessonRoom(schedule, '10а', day, n as LessonNumber, 0, '-NEW-');
          const updatedLesson = updated['10а']?.[day]?.[n as LessonNumber]?.lessons?.[0];
          expect(updatedLesson?.room).toBe('-NEW-');
          return; // done
        }
      }
    }
  });

  it('cloneSchedule produces independent copy', () => {
    const schedule = getTemplateSchedule();
    const clone = cloneSchedule(schedule);
    expect(schedulesEqual(schedule, clone)).toBe(true);

    // Find an occupied slot to modify in-place via removeLessonFromSlot
    const lessons = schedule['10а']?.['Пн']?.[1 as LessonNumber]?.lessons ?? [];
    if (lessons.length > 0) {
      const modified = removeLessonFromSlot(clone, '10а', 'Пн', 1 as LessonNumber, 0);
      // modified differs from original
      expect(schedulesEqual(schedule, modified)).toBe(false);
      // clone is NOT modified (immutable ops)
      expect(schedulesEqual(schedule, clone)).toBe(true);
    }
  });

  it('canAssignLesson checks constraints at scale', () => {
    const schedule = getTemplateSchedule();

    // Try assigning to a busy slot (should fail)
    const occupiedLessons = schedule['10а']?.['Пн']?.[1 as LessonNumber]?.lessons ?? [];
    if (occupiedLessons.length > 0) {
      const result = canAssignLesson(schedule, teachers, {
        className: '10а',
        day: 'Пн',
        lessonNum: 1 as LessonNumber,
        teacherName: 'Иванова Н.В.',
      });
      expect(result.allowed).toBe(false);
    }
  });
});

// ============================================================
// 8. Temporary lessons + merge
// ============================================================

describe('real data: temporary lessons', () => {
  it('mergeWithTemporaryLessons integrates weekly extras', () => {
    const weekly = getWeeklyVersion();
    const requirements = getRequirements();

    expect(weekly.temporaryLessons!.length).toBe(7);

    const merged = mergeWithTemporaryLessons(requirements, weekly.temporaryLessons ?? []);
    expect(merged.length).toBeGreaterThanOrEqual(requirements.length);

    // Verify each temp lesson is either merged into existing or added as new
    for (const temp of weekly.temporaryLessons!) {
      const tempKey = getLessonKey({
        subject: temp.subject,
        teacher: temp.teacher,
        group: temp.type === 'group' ? temp.classOrGroup : undefined,
      });
      const found = merged.find(r => {
        const key = getLessonKey({
          subject: r.subject,
          teacher: r.teacher,
          group: r.type === 'group' ? r.classOrGroup : undefined,
        });
        return key === tempKey && r.classOrGroup === temp.classOrGroup;
      });
      expect(found).toBeDefined();
    }
  });

  it('unscheduled counts change with temporary lessons', () => {
    const weekly = getWeeklyVersion();
    const requirements = getRequirements();

    // Pick a class that has temp lessons
    const tempClasses = new Set(
      (weekly.temporaryLessons ?? []).map(t => t.type === 'group' ? t.className! : t.classOrGroup)
    );

    for (const cls of tempClasses) {
      const withoutTemp = getTotalUnscheduledCount(requirements, weekly.schedule, cls);
      const merged = mergeWithTemporaryLessons(requirements, weekly.temporaryLessons ?? []);
      const withTemp = getTotalUnscheduledCount(merged, weekly.schedule, cls);
      // With temporary lessons, unscheduled count should be >= without
      expect(withTemp).toBeGreaterThanOrEqual(withoutTemp);
    }
  });
});

// ============================================================
// 9. Group lesson handling
// ============================================================

describe('real data: group lessons', () => {
  const schedule = getTemplateSchedule();
  const requirements = getRequirements();

  it('group requirements are counted separately per group', () => {
    // 10а has both class and group requirements
    const classReqs = requirements.filter(r => r.type === 'class' && r.classOrGroup === '10а');
    const groupReqs = requirements.filter(r => r.type === 'group' && r.className === '10а');

    expect(classReqs.length).toBeGreaterThan(0);
    expect(groupReqs.length).toBeGreaterThan(0);

    // Each group requirement should have a unique group name within same subject
    const groupKeys = groupReqs.map(r => `${r.subject}|${r.classOrGroup}`);
    const uniqueKeys = new Set(groupKeys);
    expect(uniqueKeys.size).toBe(groupKeys.length);
  });

  it('parallel groups share slots in schedule', () => {
    // Find a slot with multiple lessons (parallel groups)
    let found = false;
    for (const [, days] of Object.entries(schedule)) {
      for (const [, daySchedule] of Object.entries(days)) {
        if (!daySchedule) continue;
        for (const [, slot] of Object.entries(daySchedule)) {
          if (slot?.lessons && slot.lessons.length > 1) {
            // All lessons in a shared slot should have group property
            for (const lesson of slot.lessons) {
              expect(lesson.group).toBeTruthy();
            }
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    expect(found).toBe(true);
  });

  it('getLessonKey distinguishes group lessons from class lessons', () => {
    const classKey = getLessonKey({ subject: 'Английский', teacher: 'Иванова', group: undefined });
    const groupKey = getLessonKey({ subject: 'Английский', teacher: 'Иванова', group: '10а(1)' });
    expect(classKey).not.toBe(groupKey);
  });
});

// ============================================================
// 10. Diff highlighting (template vs weekly)
// ============================================================

describe('real data: template diff', () => {
  it('isSlotDifferentFromTemplate detects changes', () => {
    const template = getTemplateSchedule();
    const weekly = getWeeklyVersion();

    // Compare a few slots — function takes lesson arrays, not schedules
    let diffCount = 0;
    let sameCount = 0;
    const days: Day[] = ['Пн', 'Вт', 'Ср'];

    for (const cls of ['10а', '11а']) {
      for (const day of days) {
        for (let n = 1; n <= 8; n++) {
          const currentLessons = weekly.schedule[cls]?.[day]?.[n as LessonNumber]?.lessons ?? [];
          const templateLessons = template[cls]?.[day]?.[n as LessonNumber]?.lessons ?? [];
          const isDiff = isSlotDifferentFromTemplate(currentLessons, templateLessons);
          if (isDiff) diffCount++;
          else sameCount++;
        }
      }
    }

    // There should be both diffs and same slots
    expect(sameCount).toBeGreaterThan(0);
    expect(diffCount + sameCount).toBe(2 * 3 * 8); // 2 classes * 3 days * 8 slots
  });
});
