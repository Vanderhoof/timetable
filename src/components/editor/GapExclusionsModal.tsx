/**
 * GapExclusionsModal — Configure which classes to exclude from gap search.
 */

import { useState, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormActions } from '@/components/common/FormActions';
import { useDataStore } from '@/stores';
import { suggestGapExclusions } from '@/logic';
import { compareClassNames } from '@/utils/formatLesson';
import styles from './GapExclusionsModal.module.css';

interface GapExclusionsModalProps {
  onClose: () => void;
}

export function GapExclusionsModal({ onClose }: GapExclusionsModalProps) {
  const classes = useDataStore((state) => state.classes);
  const gapExcludedClasses = useDataStore((state) => state.gapExcludedClasses);
  const setGapExcludedClasses = useDataStore((state) => state.setGapExcludedClasses);

  const sortedNames = useMemo(
    () => classes.map(c => c.name).sort(compareClassNames),
    [classes]
  );

  // Initialize local state: if DB has exclusions use them, otherwise auto-suggest
  const [excluded, setExcluded] = useState<Set<string>>(() => {
    if (gapExcludedClasses.length > 0) {
      return new Set(gapExcludedClasses);
    }
    return new Set(suggestGapExclusions(sortedNames));
  });

  const toggle = (name: string) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSave = () => {
    setGapExcludedClasses(Array.from(excluded));
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Исключения из поиска окон"
      size="small"
      footer={<FormActions onCancel={onClose} onSave={handleSave} />}
    >
      <div className={styles.description}>
        Отмеченные классы не будут учитываться при поиске окон.
      </div>
      <div className={styles.grid}>
        {sortedNames.map(name => (
          <label key={name} className={styles.item}>
            <input
              type="checkbox"
              checked={excluded.has(name)}
              onChange={() => toggle(name)}
            />
            <span>{name}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
