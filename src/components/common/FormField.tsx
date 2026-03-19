/**
 * FormField — Shared label + children wrapper for form fields.
 * Also exports formStyles for the .form container and .input class.
 */

import type { ReactNode } from 'react';
import styles from './FormField.module.css';

export { styles as formStyles };

interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
