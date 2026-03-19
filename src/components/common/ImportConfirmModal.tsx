/**
 * Confirmation modal shown before importing data.
 * Displays a summary of file contents and warns about data replacement.
 */

import type { ExportSummary } from '@/db/import-export';
import { Modal } from './Modal';
import { Button } from './Button';
import styles from './ImportConfirmModal.module.css';

interface ImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: ExportSummary | null;
  isImporting: boolean;
}

export function ImportConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  summary,
  isImporting,
}: ImportConfirmModalProps) {
  if (!summary) return null;

  const exportDate = summary.exportedAt
    ? new Date(summary.exportedAt).toLocaleString('ru-RU')
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Открыть файл" size="small">
      <div className={styles.content}>
        <div className={styles.summary}>
          <h4 className={styles.heading}>Содержимое файла:</h4>
          <ul className={styles.list}>
            <li>Учителя: {summary.teacherCount}</li>
            <li>Кабинеты: {summary.roomCount}</li>
            <li>Классы: {summary.classCount}</li>
            {summary.groupCount > 0 && <li>Группы: {summary.groupCount}</li>}
            <li>Занятия: {summary.requirementCount}</li>
            <li>Версии расписания: {summary.versionCount}</li>
          </ul>
          {exportDate && (
            <p className={styles.date}>Экспортировано: {exportDate}</p>
          )}
        </div>

        <div className={styles.warning}>
          Все текущие данные будут заменены.
          Автоматическая резервная копия будет создана.
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isImporting} title="Отменить импорт">
            Отмена
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isImporting} title="Заменить текущие данные содержимым файла">
            {isImporting ? 'Импорт...' : 'Заменить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
