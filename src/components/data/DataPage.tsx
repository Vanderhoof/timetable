/**
 * DataPage - View and edit imported data (teachers, rooms, requirements)
 */

import { useState, useRef, useCallback } from 'react';
import { TeachersTable } from './TeachersTable';
import { RequirementsTable } from './RequirementsTable';
import { RoomsTable } from './RoomsTable';
import { ClassesTable } from './ClassesTable';
import { GroupsTable } from './GroupsTable';
import { SubjectsTable } from './SubjectsTable';
import { SchoolWeekModal } from './SchoolWeekModal';
import { Button } from '@/components/common/Button';
import styles from './DataPage.module.css';

type DataTab = 'teachers' | 'requirements' | 'rooms' | 'classes' | 'groups' | 'subjects';

export function DataPage() {
  const [activeTab, setActiveTab] = useState<DataTab>('teachers');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [schoolWeekModalOpen, setSchoolWeekModalOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    setShowScrollTop((pageRef.current?.scrollTop ?? 0) > 150);
  }, []);

  const scrollToTop = useCallback(() => {
    pageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className={styles.page} ref={pageRef} onScroll={handleScroll}>
      <div className={styles.header}>
        <h1 className={styles.title}>Данные</h1>
        <div className={styles.tabs}>
          <Button
            variant="ghost"
            onClick={() => setSchoolWeekModalOpen(true)}
            title="Настройки учебной недели: число дней и уроков"
          >
            Учебная неделя
          </Button>
          <Button
            variant={activeTab === 'teachers' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('teachers')}
            title="Список учителей, предметов и запретов"
          >
            Учителя
          </Button>
          <Button
            variant={activeTab === 'requirements' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('requirements')}
            title="Список занятий по классам и группам"
          >
            Занятия
          </Button>
          <Button
            variant={activeTab === 'rooms' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('rooms')}
            title="Список кабинетов"
          >
            Кабинеты
          </Button>
          <Button
            variant={activeTab === 'classes' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('classes')}
            title="Список классов с числом учеников"
          >
            Классы
          </Button>
          <Button
            variant={activeTab === 'groups' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('groups')}
            title="Группы и параллельность"
          >
            Группы
          </Button>
          <Button
            variant={activeTab === 'subjects' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('subjects')}
            title="Список предметов"
          >
            Предметы
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'teachers' && <TeachersTable />}
        {activeTab === 'requirements' && <RequirementsTable />}
        {activeTab === 'rooms' && <RoomsTable />}
        {activeTab === 'classes' && <ClassesTable />}
        {activeTab === 'groups' && <GroupsTable />}
        {activeTab === 'subjects' && <SubjectsTable />}
      </div>

      {showScrollTop && (
        <button
          className={styles.scrollTopBtn}
          onClick={scrollToTop}
          title="Наверх"
          aria-label="Прокрутить наверх"
        >
          ↑
        </button>
      )}

      {schoolWeekModalOpen && (
        <SchoolWeekModal onClose={() => setSchoolWeekModalOpen(false)} />
      )}
    </div>
  );
}
