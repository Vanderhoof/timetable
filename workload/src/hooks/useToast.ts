import { useCallback } from 'react';
import { useToastStore } from '../toastStore';
import type { ToastType } from '../toastStore';

export function useToast() {
  const add = useToastStore((s) => s.add);
  const notify = useCallback(
    (message: string, type: ToastType = 'success', duration?: number) => add(message, type, duration),
    [add],
  );
  return { notify };
}
