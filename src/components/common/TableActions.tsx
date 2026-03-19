/**
 * TableActions — Edit + Delete icon buttons for data table rows.
 */

import { Button } from './Button';
import styles from '../data/DataTable.module.css';

interface TableActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function TableActions({ onEdit, onDelete }: TableActionsProps) {
  return (
    <td className={styles.actionsCell}>
      <Button variant="ghost" size="small" onClick={onEdit} title="Редактировать">
        ✎
      </Button>
      <Button variant="ghost" size="small" onClick={onDelete} title="Удалить">
        🗑
      </Button>
    </td>
  );
}
