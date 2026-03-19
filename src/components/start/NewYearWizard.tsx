/**
 * New Academic Year Wizard
 * 4-step guided flow: copy teachers → copy rooms → archive → confirm clear
 */

import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { exportToJson, downloadJson } from '@/db/import-export';
import { addYearSnapshot } from '@/db/yearSnapshots';
import { clearScheduleData } from '@/db/data';
import styles from './NewYearWizard.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function getDefaultYearLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function NewYearWizard({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [yearLabel, setYearLabel] = useState(getDefaultYearLabel);
  const [teachersCopied, setTeachersCopied] = useState(false);
  const [roomsCopied, setRoomsCopied] = useState(false);
  const [archiveSaved, setArchiveSaved] = useState(false);
  const [isSavingArchive, setIsSavingArchive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const teachers = useDataStore((state) => state.teachers);
  const rooms = useDataStore((state) => state.rooms);
  const reloadData = useDataStore((state) => state.reloadData);

  const handleClose = useCallback(() => {
    setStep(1);
    setYearLabel(getDefaultYearLabel());
    setTeachersCopied(false);
    setRoomsCopied(false);
    setArchiveSaved(false);
    setIsProcessing(false);
    onClose();
  }, [onClose]);

  const handleCopyTeachers = useCallback(async () => {
    const list = Object.values(teachers);
    const header = 'Имя\tПредметы\tКабинет\tМессенджер\tТелефон';
    const rows = list.map(t => [
      t.name,
      t.subjects?.join(', ') ?? '',
      t.defaultRoom ?? '',
      t.messenger ?? '',
      t.phone ?? '',
    ].join('\t'));
    await navigator.clipboard.writeText([header, ...rows].join('\n'));
    setTeachersCopied(true);
  }, [teachers]);

  const handleCopyRooms = useCallback(async () => {
    const list = Object.values(rooms);
    const header = 'Кабинет\tПолное название\tВместимость';
    const rows = list.map(r => [
      r.shortName,
      r.fullName,
      r.capacity ?? '',
    ].join('\t'));
    await navigator.clipboard.writeText([header, ...rows].join('\n'));
    setRoomsCopied(true);
  }, [rooms]);

  const handleSaveArchive = useCallback(async () => {
    setIsSavingArchive(true);
    try {
      const json = await exportToJson();
      await addYearSnapshot(yearLabel, json);
      downloadJson(json, `год-${yearLabel}.json`);
      setArchiveSaved(true);
    } finally {
      setIsSavingArchive(false);
    }
  }, [yearLabel]);

  const handleStartNewYear = useCallback(async () => {
    setIsProcessing(true);
    try {
      await clearScheduleData();
      await reloadData();
      handleClose();
    } finally {
      setIsProcessing(false);
    }
  }, [reloadData, handleClose]);

  const title = step === 1 ? 'Учителя'
    : step === 2 ? 'Кабинеты'
    : step === 3 ? 'Архив прошлого года'
    : 'Начать новый год';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Новый учебный год — ${title}`} size="small">
      <div className={styles.wizard}>

        {/* Step indicator */}
        <div className={styles.steps}>
          {([1, 2, 3, 4] as const).map(s => (
            <div key={s} className={`${styles.step} ${step === s ? styles.stepActive : step > s ? styles.stepDone : ''}`}>
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Teachers */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <p className={styles.desc}>
              Скопируйте список учителей, чтобы быстро восстановить их в новом году или перенести в другое приложение.
            </p>
            <div className={styles.actions}>
              <Button variant="secondary" size="small" onClick={handleCopyTeachers}>
                {teachersCopied ? '✓ Скопировано' : `Скопировать (${Object.keys(teachers).length} уч.)`}
              </Button>
            </div>
            <div className={styles.footer}>
              <Button variant="ghost" onClick={handleClose}>Отмена</Button>
              <Button variant="primary" onClick={() => setStep(2)}>Далее →</Button>
            </div>
          </div>
        )}

        {/* Step 2: Rooms */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <p className={styles.desc}>
              Скопируйте список кабинетов.
            </p>
            <div className={styles.actions}>
              <Button variant="secondary" size="small" onClick={handleCopyRooms}>
                {roomsCopied ? '✓ Скопировано' : `Скопировать (${Object.keys(rooms).length} каб.)`}
              </Button>
            </div>
            <div className={styles.footer}>
              <Button variant="ghost" onClick={() => setStep(1)}>← Назад</Button>
              <Button variant="primary" onClick={() => setStep(3)}>Далее →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Archive */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <p className={styles.desc}>
              Сохраните архив текущего года — он останется в приложении и будет доступен для просмотра в Настройках.
            </p>
            <div className={styles.archiveRow}>
              <input
                type="text"
                className={styles.yearInput}
                value={yearLabel}
                onChange={(e) => setYearLabel(e.target.value)}
                placeholder="2024-2025"
                aria-label="Учебный год"
              />
              <Button
                variant="secondary"
                size="small"
                onClick={handleSaveArchive}
                disabled={isSavingArchive || !yearLabel.trim()}
              >
                {archiveSaved ? '✓ Сохранено' : isSavingArchive ? 'Сохранение...' : 'Сохранить архив'}
              </Button>
            </div>
            {!archiveSaved && (
              <p className={styles.hint}>Можно пропустить, но тогда откат невозможен.</p>
            )}
            <div className={styles.footer}>
              <Button variant="ghost" onClick={() => setStep(2)}>← Назад</Button>
              <Button variant="primary" onClick={() => setStep(4)}>Далее →</Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <p className={styles.desc}>
              После нажатия «Начать новый год» будут удалены все версии расписания, классы и список занятий.{' '}
              <strong>Учителя и кабинеты сохранятся.</strong>
            </p>
            {!archiveSaved && (
              <p className={styles.warning}>
                Архив не сохранён — откат после удаления невозможен.
              </p>
            )}
            <div className={styles.footer}>
              <Button variant="ghost" onClick={() => setStep(3)} disabled={isProcessing}>← Назад</Button>
              <Button variant="primary" onClick={handleStartNewYear} disabled={isProcessing}>
                {isProcessing ? 'Удаление...' : 'Начать новый год'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
