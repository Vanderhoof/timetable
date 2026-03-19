/**
 * Tests for year snapshot CRUD operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { YearSnapshot } from './database';

const mockDb = vi.hoisted(() => {
  const snapshots: YearSnapshot[] = [];
  let nextId = 1;

  return {
    yearSnapshots: {
      orderBy: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockImplementation(() => Promise.resolve([...snapshots])),
      reverse: vi.fn().mockImplementation(() => Promise.resolve([...snapshots].reverse())),
      add: vi.fn().mockImplementation((snap: YearSnapshot) => {
        const id = nextId++;
        snapshots.push({ ...snap, id });
        return Promise.resolve(id);
      }),
      delete: vi.fn().mockImplementation((id: number) => {
        const idx = snapshots.findIndex(s => s.id === id);
        if (idx !== -1) snapshots.splice(idx, 1);
        return Promise.resolve();
      }),
      _snapshots: snapshots,
      _reset: () => {
        snapshots.length = 0;
        nextId = 1;
      },
    },
  };
});

vi.mock('@/db/database', () => ({ db: mockDb }));

import { getYearSnapshots, addYearSnapshot, deleteYearSnapshot } from './yearSnapshots';

beforeEach(() => {
  mockDb.yearSnapshots._reset();
  vi.clearAllMocks();

  // Re-wire fluent chain: orderBy(...).toArray() returns ordered array
  // and reverse() after toArray() reverses the array
  mockDb.yearSnapshots.orderBy.mockReturnValue({
    toArray: vi.fn().mockImplementation(() => {
      return Promise.resolve([...mockDb.yearSnapshots._snapshots]);
    }),
  });
});

describe('addYearSnapshot + getYearSnapshots', () => {
  it('saves and retrieves a snapshot with correct label and data', async () => {
    await addYearSnapshot('2024-2025', '{"test":true}');
    const snapshots = await getYearSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].yearLabel).toBe('2024-2025');
    expect(snapshots[0].data).toBe('{"test":true}');
  });

  it('returns newest first (descending by createdAt)', async () => {
    // Add in order: older, newer
    const older = new Date('2024-01-01');
    const newer = new Date('2025-01-01');
    mockDb.yearSnapshots._snapshots.push(
      { id: 1, yearLabel: '2023-2024', data: 'old', createdAt: older },
      { id: 2, yearLabel: '2024-2025', data: 'new', createdAt: newer }
    );
    // orderBy returns in ascending order, getYearSnapshots reverses it
    mockDb.yearSnapshots.orderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([...mockDb.yearSnapshots._snapshots]),
    });

    const snapshots = await getYearSnapshots();
    expect(snapshots[0].yearLabel).toBe('2024-2025'); // newer first
    expect(snapshots[1].yearLabel).toBe('2023-2024');
  });
});

describe('deleteYearSnapshot', () => {
  it('removes the entry by id, others remain intact', async () => {
    mockDb.yearSnapshots._snapshots.push(
      { id: 1, yearLabel: '2023-2024', data: 'a', createdAt: new Date() },
      { id: 2, yearLabel: '2024-2025', data: 'b', createdAt: new Date() }
    );

    await deleteYearSnapshot(1);
    expect(mockDb.yearSnapshots._snapshots).toHaveLength(1);
    expect(mockDb.yearSnapshots._snapshots[0].id).toBe(2);
  });
});
