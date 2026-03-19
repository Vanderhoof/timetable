/**
 * Context Menu component
 */

import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}

export function ContextMenu({ isOpen, x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Use capture to handle clicks before they bubble
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Adjust position to stay in viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8;
    }
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8;
    }

    menu.style.left = `${Math.max(8, adjustedX)}px`;
    menu.style.top = `${Math.max(8, adjustedY)}px`;
  }, [isOpen, x, y]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left: x, top: y }}
      role="menu"
    >
      {children}
    </div>,
    document.body
  );
}

interface ContextMenuItemProps {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}

export function ContextMenuItem({
  onClick,
  disabled = false,
  danger = false,
  children,
}: ContextMenuItemProps) {
  return (
    <button
      className={`${styles.item} ${danger ? styles.danger : ''}`}
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
    >
      {children}
    </button>
  );
}

export function ContextMenuDivider() {
  return <div className={styles.divider} role="separator" />;
}
