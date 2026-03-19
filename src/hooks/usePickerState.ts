/**
 * usePickerState<T> — unified open/close state for modal pickers.
 *
 * Returns a stable object (via useMemo) so it can safely be used in useCallback deps.
 * The object reference only changes when the open/close state or data changes.
 *
 * Usage:
 *   const picker = usePickerState<{ day: Day; lessonNum: LessonNumber }>();
 *   picker.open({ day, lessonNum })  // opens with data
 *   picker.close()                  // closes, data becomes null
 *   picker.isOpen                   // true when open
 *   picker.data                     // { day, lessonNum } | null
 */

import { useState, useCallback, useMemo } from 'react';

export function usePickerState<T>() {
  const [data, setData] = useState<T | null>(null);
  const open = useCallback((newData: T) => setData(newData), []);
  const close = useCallback(() => setData(null), []);

  return useMemo(
    () => ({ isOpen: data !== null, data, open, close }),
    [data, open, close]
  );
}
