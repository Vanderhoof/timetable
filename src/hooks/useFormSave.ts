/**
 * useFormSave - Shared save logic for edit modals.
 *
 * Provides:
 * - isSaving: boolean state (true while async save is in flight)
 * - isNew: true when item is null/undefined (adding), false when editing
 * - save(fn, onError?): wraps fn() with setIsSaving + try/catch/finally, calls onClose on success
 */

import { useState, useCallback } from 'react';

export function useFormSave<T>(
  item: T | null | undefined,
  onClose: () => void
): {
  isNew: boolean;
  isSaving: boolean;
  save: (fn: () => Promise<unknown>, onError?: (error: unknown) => void) => Promise<void>;
} {
  const [isSaving, setIsSaving] = useState(false);
  const isNew = item == null;

  const save = useCallback(
    async (fn: () => Promise<unknown>, onError?: (error: unknown) => void) => {
      setIsSaving(true);
      try {
        await fn();
        onClose();
      } catch (error) {
        onError?.(error);
      } finally {
        setIsSaving(false);
      }
    },
    [onClose]
  );

  return { isNew, isSaving, save };
}
