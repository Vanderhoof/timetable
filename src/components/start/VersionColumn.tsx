/**
 * VersionColumn — A single column of versions (Technical, Template, or Weekly).
 * Extracted from StartPage to eliminate 3x duplication.
 */

import type { ReactNode } from 'react';
import type { VersionListItem, VersionType } from '@/types';
import { Button } from '@/components/common/Button';
import { DropdownMenu, type MenuItem } from '@/components/common/DropdownMenu';
import styles from './StartPage.module.css';

interface VersionColumnProps {
  title: string;
  type: VersionType;
  versions: VersionListItem[];
  hasData: boolean;
  onLoad: (id: string) => void;
  onCreate: () => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onExport?: (id: string, e: React.MouseEvent) => void;
  onSaveAs?: (id: string, name: string, type: VersionType, e: React.MouseEvent) => void;
  onSetActiveTemplate?: (id: string, e: React.MouseEvent) => void;
  renderDate?: (v: VersionListItem) => ReactNode;
}

export function VersionColumn({
  title,
  type,
  versions,
  hasData,
  onLoad,
  onCreate,
  onDelete,
  onExport,
  onSaveAs,
  onSetActiveTemplate,
  renderDate,
}: VersionColumnProps) {
  const defaultRenderDate = (v: VersionListItem) =>
    new Date(v.createdAt).toLocaleDateString('ru-RU');

  const dateRenderer = renderDate ?? defaultRenderDate;

  const createTooltip = !hasData
    ? 'Сначала загрузите данные'
    : type === 'technical'
      ? 'Создать новое техническое расписание'
      : type === 'template'
        ? 'Создать новый шаблон расписания'
        : 'Создать расписание на неделю';

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>{title}</div>
      <Button
        variant="primary"
        onClick={onCreate}
        disabled={!hasData}
        className={styles.createButton}
        title={createTooltip}
      >
        Создать
      </Button>
      <div className={styles.versionList}>
        {versions.length === 0 ? (
          <div className={styles.emptyMessage}>
            <p>Нет сохранённых версий</p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Нажмите «Создать» для начала работы
            </p>
          </div>
        ) : (
          versions.map((v) => {
            const menuItems: MenuItem[] = [
              ...(onExport ? [{ label: 'Экспорт', onClick: (e: React.MouseEvent) => onExport(v.id, e) }] : []),
              ...(onSaveAs ? [{ label: 'Сохранить как', onClick: (e: React.MouseEvent) => onSaveAs(v.id, v.name, v.type, e) }] : []),
              ...(onDelete ? [{ label: 'Удалить', onClick: (e: React.MouseEvent) => onDelete(v.id, e), variant: 'danger' as const }] : []),
            ];

            return (
              <div
                key={v.id}
                className={`${styles.versionItem} ${type === 'template' && v.isActiveTemplate ? styles.activeTemplate : ''}`}
                onClick={() => onLoad(v.id)}
              >
                <div className={styles.versionTopRow}>
                  {type === 'template' && onSetActiveTemplate && (
                    <input
                      type="radio"
                      name="activeTemplate"
                      className={styles.templateRadio}
                      checked={v.isActiveTemplate ?? false}
                      onChange={() => {}}
                      onClick={(e) => onSetActiveTemplate(v.id, e)}
                      title="Сделать активным шаблоном"
                    />
                  )}
                  <div className={styles.versionName}>{v.name}</div>
                  <DropdownMenu items={menuItems} />
                </div>
                <div className={styles.versionDate}>
                  {dateRenderer(v)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
