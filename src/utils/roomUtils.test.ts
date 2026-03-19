import { describe, it, expect } from 'vitest';
import { inferRoomShortName } from './roomUtils';

describe('inferRoomShortName', () => {
  it('extracts 3-digit prefix wrapped in dashes', () => {
    expect(inferRoomShortName('228 Биология')).toBe('-228-');
    expect(inferRoomShortName('114 Кабинет математики')).toBe('-114-');
  });

  it('extracts 3-digit prefix with trailing Cyrillic letter, wrapped in dashes', () => {
    expect(inferRoomShortName('228А математика')).toBe('-228А-');
    expect(inferRoomShortName('312б физика')).toBe('-312б-');
  });

  it('extracts 2-digit prefix wrapped in dashes', () => {
    expect(inferRoomShortName('22а Химия')).toBe('-22а-');
    expect(inferRoomShortName('11 Кабинет')).toBe('-11-');
  });

  it('returns null when name starts with a single digit', () => {
    expect(inferRoomShortName('3б кабинет')).toBeNull();
  });

  it('returns null when name starts with a letter', () => {
    expect(inferRoomShortName('ГИМ зал')).toBeNull();
    expect(inferRoomShortName('Спортзал')).toBeNull();
    expect(inferRoomShortName('Актовый зал')).toBeNull();
  });

  it('handles empty string', () => {
    expect(inferRoomShortName('')).toBeNull();
  });

  it('trims whitespace before matching', () => {
    expect(inferRoomShortName('  228А математика')).toBe('-228А-');
  });
});
