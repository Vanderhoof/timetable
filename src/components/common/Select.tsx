/**
 * Select/Dropdown component
 */

import { type SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  fullWidth = false,
  className,
  disabled,
  ...props
}: SelectProps) {
  const classNames = [
    styles.select,
    fullWidth && styles.fullWidth,
    className,
  ].filter(Boolean).join(' ');

  return (
    <select
      className={classNames}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}
