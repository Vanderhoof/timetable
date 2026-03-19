import { useEffect, useRef, useState } from 'react';
import { useToastStore } from '../toastStore';
import type { Toast } from '../toastStore';
import styles from './ToastContainer.module.css';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger enter animation after mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Auto-dismiss (duration=0 means persistent)
  useEffect(() => {
    if (toast.duration === 0) return;
    timerRef.current = setTimeout(() => handleDismiss(), toast.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, toast.duration]);

  function handleDismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
  }

  function handleTransitionEnd() {
    if (exiting) dismiss(toast.id);
  }

  const className = [
    styles.toast,
    styles[toast.type],
    visible && !exiting ? styles.toastVisible : '',
    exiting ? styles.toastExiting : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} onTransitionEnd={handleTransitionEnd}>
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Закрыть">
        ×
      </button>
    </div>
  );
}
