import { describe, it, expect } from 'vitest';
import { indexBy } from './indexBy';

describe('indexBy', () => {
  it('indexes items by the given key', () => {
    const items = [
      { name: 'Иванова Т.С.', subjects: ['Математика'] },
      { name: 'Петров А.П.', subjects: ['Физика'] },
    ];
    const result = indexBy(items, 'name');
    expect(result['Иванова Т.С.']).toBe(items[0]);
    expect(result['Петров А.П.']).toBe(items[1]);
  });

  it('returns an empty object for an empty array', () => {
    expect(indexBy([], 'name')).toEqual({});
  });

  it('last item wins when keys collide', () => {
    const items = [
      { shortName: 'A', fullName: 'First' },
      { shortName: 'A', fullName: 'Second' },
    ];
    const result = indexBy(items, 'shortName');
    expect(result['A'].fullName).toBe('Second');
  });

  it('works with numeric-string values', () => {
    const items = [{ id: '1', label: 'x' }, { id: '2', label: 'y' }];
    const result = indexBy(items, 'id');
    expect(Object.keys(result)).toEqual(['1', '2']);
  });
});
