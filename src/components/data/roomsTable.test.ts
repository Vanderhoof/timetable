/**
 * Tests for RoomsTable TSV export format
 */

import { describe, it, expect } from 'vitest';
import type { Room } from '@/types';

// Replicates the TSV cell builder from RoomsTable.handleCopyTable
function buildMultiClassCell(room: Partial<Room>): string {
  return room.multiClass && room.multiClass > 1 ? `${room.multiClass}` : '';
}

describe('RoomsTable TSV export — multiClass format', () => {
  it('exports multiClass as plain number, not ×N', () => {
    const cell = buildMultiClassCell({ multiClass: 2 });
    expect(cell).toBe('2');
    // Must parse correctly for re-import
    expect(Number(cell)).toBe(2);
  });

  it('exports empty string when multiClass is 1 or absent', () => {
    expect(buildMultiClassCell({ multiClass: 1 })).toBe('');
    expect(buildMultiClassCell({})).toBe('');
  });

  it('regression: old ×N format was not parseable as a number', () => {
    // Document why the old format was broken
    expect(Number('×2')).toBeNaN();
  });
});
