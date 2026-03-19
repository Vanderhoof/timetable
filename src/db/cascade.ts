/**
 * Cascade rename operations for reference entities.
 *
 * Entity names are used as cross-table join keys (not IDs). When a name changes,
 * every field holding the old name must be updated atomically.
 *
 * All functions operate directly on IndexedDB. In-memory store state is updated
 * by the calling store action after these functions return.
 */

import { db } from './database';
import type { Schedule, LessonRequirement, Substitution } from '@/types';
import { forEachSlot } from '@/logic/traversal';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Return a deep-cloned schedule with teacher name updated in every lesson slot.
 * Updates: ScheduledLesson.teacher, .teacher2, .originalTeacher
 */
function renameTeacherInSchedule(schedule: Schedule, oldName: string, newName: string): Schedule {
  const result: Schedule = structuredClone(schedule);
  forEachSlot(result, (_cn, _day, _num, lessons) => {
    for (const lesson of lessons) {
      if (lesson.teacher === oldName) lesson.teacher = newName;
      if (lesson.teacher2 === oldName) lesson.teacher2 = newName;
      if (lesson.originalTeacher === oldName) lesson.originalTeacher = newName;
    }
  });
  return result;
}

/**
 * Return a deep-cloned schedule with room shortName updated in every lesson slot.
 */
function renameRoomInSchedule(schedule: Schedule, oldShortName: string, newShortName: string): Schedule {
  const result: Schedule = structuredClone(schedule);
  forEachSlot(result, (_cn, _day, _num, lessons) => {
    for (const lesson of lessons) {
      if (lesson.room === oldShortName) lesson.room = newShortName;
    }
  });
  return result;
}

/**
 * Return a new schedule with class top-level key renamed (oldName → newName).
 * Does not touch lesson-level fields.
 */
function renameClassKeyInSchedule(schedule: Schedule, oldName: string, newName: string): Schedule {
  if (!(oldName in schedule)) return schedule;
  const result: Schedule = { ...schedule, [newName]: schedule[oldName] };
  delete result[oldName];
  return result;
}

/**
 * Return a deep-cloned schedule with group index updated in the owning class slots.
 * ScheduledLesson.group stores the index "(д)", scoped to the class that owns the group.
 */
function renameGroupIndexInSchedule(
  schedule: Schedule,
  className: string,
  oldIndex: string,
  newIndex: string
): Schedule {
  const result: Schedule = structuredClone(schedule);
  const classSchedule = result[className];
  if (!classSchedule) return result;
  forEachSlot({ [className]: classSchedule }, (_cn, _day, _num, lessons) => {
    for (const lesson of lessons) {
      if (lesson.group === oldIndex) lesson.group = newIndex;
    }
  });
  return result;
}

/**
 * Return a deep-cloned schedule with subject name updated in every lesson slot.
 */
function renameSubjectInSchedule(schedule: Schedule, oldName: string, newName: string): Schedule {
  const result: Schedule = structuredClone(schedule);
  forEachSlot(result, (_cn, _day, _num, lessons) => {
    for (const lesson of lessons) {
      if (lesson.subject === oldName) lesson.subject = newName;
    }
  });
  return result;
}

// ─── Public cascade functions ─────────────────────────────────────────────────

/**
 * Cascade a teacher name change to all DB records that reference the teacher.
 *
 * Updates:
 * - db.lessonRequirements: .teacher, .teacher2
 * - All versions: schedule ScheduledLesson.teacher, .teacher2, .originalTeacher
 * - All versions: substitutions[].originalTeacher, .replacingTeacher
 * - All versions: temporaryLessons[].teacher, .teacher2
 */
export async function cascadeTeacherRename(oldName: string, newName: string): Promise<void> {
  // LessonRequirements
  const reqs = await db.lessonRequirements
    .filter(r => r.teacher === oldName || r.teacher2 === oldName)
    .toArray();
  for (const req of reqs) {
    const updates: Partial<LessonRequirement> = {};
    if (req.teacher === oldName) updates.teacher = newName;
    if (req.teacher2 === oldName) updates.teacher2 = newName;
    await db.lessonRequirements.update(req.id, updates);
  }

  // Versions (schedule blobs + substitutions + temporaryLessons)
  const versions = await db.versions.toArray();
  for (const version of versions) {
    const newSchedule = renameTeacherInSchedule(version.schedule, oldName, newName);

    const newSubs: Substitution[] = version.substitutions.map(s => {
      if (s.originalTeacher !== oldName && s.replacingTeacher !== oldName) return s;
      return {
        ...s,
        originalTeacher: s.originalTeacher === oldName ? newName : s.originalTeacher,
        replacingTeacher: s.replacingTeacher === oldName ? newName : s.replacingTeacher,
      };
    });

    const newTempLessons: LessonRequirement[] | undefined = version.temporaryLessons?.map(l => {
      if (l.teacher !== oldName && l.teacher2 !== oldName) return l;
      return {
        ...l,
        teacher: l.teacher === oldName ? newName : l.teacher,
        teacher2: l.teacher2 === oldName ? newName : l.teacher2,
      };
    });

    await db.versions.update(version.id, {
      schedule: newSchedule,
      substitutions: newSubs,
      ...(newTempLessons !== undefined ? { temporaryLessons: newTempLessons } : {}),
    });
  }
}

/**
 * Cascade a room shortName change to all DB records that reference the room.
 *
 * Updates:
 * - All versions: schedule ScheduledLesson.room
 * - db.teachers: .defaultRoom
 */
export async function cascadeRoomRename(oldShortName: string, newShortName: string): Promise<void> {
  // Teachers with defaultRoom
  const teachers = await db.teachers
    .filter(t => t.defaultRoom === oldShortName)
    .toArray();
  for (const teacher of teachers) {
    await db.teachers.update(teacher.id, { defaultRoom: newShortName });
  }

  // Versions (schedule blobs)
  const versions = await db.versions.toArray();
  for (const version of versions) {
    const newSchedule = renameRoomInSchedule(version.schedule, oldShortName, newShortName);
    await db.versions.update(version.id, { schedule: newSchedule });
  }
}

/**
 * Cascade a class name change to all DB records that reference the class.
 *
 * Updates:
 * - db.lessonRequirements: .classOrGroup (type=class), .className (type=group)
 * - db.groups: .className
 * - All versions: schedule top-level key rename
 * - All versions: substitutions[].classOrGroup
 */
export async function cascadeClassRename(oldName: string, newName: string): Promise<void> {
  // LessonRequirements
  const reqs = await db.lessonRequirements
    .filter(r => r.classOrGroup === oldName || r.className === oldName)
    .toArray();
  for (const req of reqs) {
    const updates: Partial<LessonRequirement> = {};
    if (req.classOrGroup === oldName) updates.classOrGroup = newName;
    if (req.className === oldName) updates.className = newName;
    await db.lessonRequirements.update(req.id, updates);
  }

  // Groups belonging to this class
  const groups = await db.groups.filter(g => g.className === oldName).toArray();
  for (const group of groups) {
    await db.groups.update(group.id, { className: newName });
  }

  // Versions
  const versions = await db.versions.toArray();
  for (const version of versions) {
    const newSchedule = renameClassKeyInSchedule(version.schedule, oldName, newName);

    const newSubs: Substitution[] = version.substitutions.map(s =>
      s.classOrGroup === oldName ? { ...s, classOrGroup: newName } : s
    );

    await db.versions.update(version.id, {
      schedule: newSchedule,
      substitutions: newSubs,
    });
  }
}

/**
 * Cascade a group name change into version schedule blobs and substitutions.
 *
 * The LessonRequirement and Group.parallelGroup cascade is handled in the store
 * action (already implemented in updateGroup). This function covers the parts
 * that live in version blobs only.
 *
 * Updates:
 * - All versions: schedule[className] ScheduledLesson.group (oldIndex → newIndex)
 * - All versions: substitutions[].classOrGroup (oldName → newName)
 *
 * @param className - the parent class that owns this group (scopes the index rename)
 * @param oldIndex  - old group index, e.g. "(д)"
 * @param newIndex  - new group index, e.g. "(дев)"
 */
/**
 * Cascade a subject name change to all DB records that reference it.
 *
 * Updates:
 * - db.lessonRequirements: .subject
 * - All versions: schedule ScheduledLesson.subject
 * - All versions: temporaryLessons[].subject
 *
 * Note: Teacher.subjects[] is updated by the store action (simple array replace).
 */
export async function cascadeSubjectRename(oldName: string, newName: string): Promise<void> {
  // LessonRequirements
  const reqs = await db.lessonRequirements
    .filter(r => r.subject === oldName)
    .toArray();
  for (const req of reqs) {
    await db.lessonRequirements.update(req.id, { subject: newName });
  }

  // Versions (schedule blobs + temporaryLessons)
  const versions = await db.versions.toArray();
  for (const version of versions) {
    const newSchedule = renameSubjectInSchedule(version.schedule, oldName, newName);

    const newTempLessons: LessonRequirement[] | undefined = version.temporaryLessons?.map(l =>
      l.subject === oldName ? { ...l, subject: newName } : l
    );

    await db.versions.update(version.id, {
      schedule: newSchedule,
      ...(newTempLessons !== undefined ? { temporaryLessons: newTempLessons } : {}),
    });
  }
}

export async function cascadeGroupRenameInVersions(
  oldGroupName: string,
  newGroupName: string,
  className: string,
  oldIndex: string,
  newIndex: string
): Promise<void> {
  const versions = await db.versions.toArray();
  for (const version of versions) {
    const newSchedule =
      oldIndex !== newIndex
        ? renameGroupIndexInSchedule(version.schedule, className, oldIndex, newIndex)
        : version.schedule;

    const newSubs: Substitution[] = version.substitutions.map(s =>
      s.classOrGroup === oldGroupName ? { ...s, classOrGroup: newGroupName } : s
    );

    await db.versions.update(version.id, {
      schedule: newSchedule,
      substitutions: newSubs,
    });
  }
}
