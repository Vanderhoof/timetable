/**
 * FormActions — Shared Cancel + Save button pair for modals.
 */

import { Button } from './Button';
import styles from './FormField.module.css';

interface FormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export function FormActions({
  onCancel,
  onSave,
  isSaving = false,
  disabled = false,
  saveLabel = 'Сохранить',
  cancelLabel = 'Отмена',
}: FormActionsProps) {
  return (
    <div className={styles.actions}>
      <Button variant="ghost" onClick={onCancel} disabled={isSaving} title="Отменить и закрыть">
        {cancelLabel}
      </Button>
      <Button variant="primary" onClick={onSave} disabled={isSaving || disabled} title="Сохранить изменения">
        {isSaving ? 'Сохранение...' : saveLabel}
      </Button>
    </div>
  );
}
