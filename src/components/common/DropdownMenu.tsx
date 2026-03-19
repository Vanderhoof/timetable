/**
 * DropdownMenu — "⋮" trigger button with a popup menu.
 * Manages its own open/close state and outside-click handling.
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './DropdownMenu.module.css';

export interface MenuItem {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  items: MenuItem[];
}

export function DropdownMenu({ items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={styles.wrapper}>
      <button className={styles.trigger} onClick={handleToggle} title="Действия">
        ⋮
      </button>
      {isOpen && (
        <div className={styles.menu}>
          {items.map((item) => (
            <button
              key={item.label}
              className={item.variant === 'danger' ? styles.danger : undefined}
              onClick={(e) => {
                item.onClick(e);
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
