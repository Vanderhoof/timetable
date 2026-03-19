/**
 * Converts an array to a Record keyed by a string field of each item.
 *
 * indexBy([{name: 'A', ...}, {name: 'B', ...}], 'name')
 * → { A: {name: 'A', ...}, B: {name: 'B', ...} }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function indexBy<T extends Record<string, any>>(
  items: T[],
  key: keyof T & string
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const item of items) {
    result[item[key] as string] = item;
  }
  return result;
}
