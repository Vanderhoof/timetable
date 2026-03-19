/**
 * DatalistInput — Input with native datalist autocomplete.
 */

import styles from './FormField.module.css';

interface DatalistInputProps {
  id: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function DatalistInput({
  id,
  options,
  value,
  onChange,
  placeholder,
  className,
  onBlur,
  onKeyDown,
}: DatalistInputProps) {
  return (
    <>
      <input
        type="text"
        className={className ?? styles.input}
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
      <datalist id={id}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
