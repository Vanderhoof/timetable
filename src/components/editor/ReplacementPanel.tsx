/**
 * ReplacementPanel - Panel for selecting a replacement lesson
 * Shows lessons that can be placed in the selected slot
 * Displayed below UnscheduledPanel in the right sidebar
 */

import { useMemo } from 'react';
import type { Day, LessonNumber, LessonRequirement, Teacher } from '@/types';
import { useDataStore, useScheduleStore } from '@/stores';
import { getSubstituteTeachers } from '@/logic';
import { LessonSelectionList } from './LessonSelectionList';
import styles from './ReplacementPanel.module.css';

interface ReplacementPanelProps {
  className: string;
  day: Day;
  lessonNum: LessonNumber;
  lessonIndex: number;
  currentLesson?: {
    subject: string;
    teacher: string;
    group?: string;
  };
  onSelect: (lesson: LessonRequirement) => void;
  onSubstituteSelect: (teacher: Teacher) => void;
  onClose: () => void;
}

export function ReplacementPanel({
  className,
  day,
  lessonNum,
  currentLesson,
  onSelect,
  onSubstituteSelect,
  onClose,
}: ReplacementPanelProps) {
  const schedule = useScheduleStore((state) => state.schedule);
  const teachers = useDataStore((state) => state.teachers);

  const substituteTeachers = useMemo(() => {
    if (!currentLesson) return [];
    return getSubstituteTeachers(schedule, teachers, currentLesson.subject, day, lessonNum, className, currentLesson.teacher);
  }, [schedule, teachers, currentLesson, day, lessonNum, className]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Замена ({day} ур.{lessonNum})</h3>
          <button className={styles.closeButton} onClick={onClose} title="Закрыть">
            ×
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <LessonSelectionList
          className={className}
          day={day}
          lessonNum={lessonNum}
          currentLesson={currentLesson}
          onSelect={onSelect}
          onClose={onClose}
          substituteTeachers={substituteTeachers}
          onSubstituteSelect={onSubstituteSelect}
        />
      </div>
    </div>
  );
}
