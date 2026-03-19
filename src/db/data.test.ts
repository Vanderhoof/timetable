/**
 * Tests for bulk data operations: replaceAllData, clearScheduleData
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockDb = vi.hoisted(() => {
  const makeTable = () => ({
    clear: vi.fn().mockResolvedValue(undefined),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  });

  const db = {
    teachers: makeTable(),
    rooms: makeTable(),
    classes: makeTable(),
    groups: makeTable(),
    lessonRequirements: makeTable(),
    versions: makeTable(),
    settings: makeTable(),
    transaction: vi.fn(),
  };

  // transaction executes the callback immediately with the tables in scope
  db.transaction.mockImplementation(
    async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => {
      await callback();
    }
  );

  return db;
});

vi.mock('@/db/database', () => ({ db: mockDb }));

import { replaceAllData, clearScheduleData } from './data';

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.transaction.mockImplementation(
    async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => {
      await callback();
    }
  );
});

// ─── replaceAllData ────────────────────────────────────────────────────────────

describe('replaceAllData', () => {
  it('replaces teachers when array is non-empty', async () => {
    await replaceAllData({ teachers: [{ id: '1', name: 'Иванова Т.С.' } as never] });
    expect(mockDb.teachers.clear).toHaveBeenCalled();
    expect(mockDb.teachers.bulkAdd).toHaveBeenCalled();
  });

  it('does NOT clear teachers when array is empty', async () => {
    await replaceAllData({ teachers: [] });
    expect(mockDb.teachers.clear).not.toHaveBeenCalled();
    expect(mockDb.teachers.bulkAdd).not.toHaveBeenCalled();
  });

  it('does NOT clear teachers when field is undefined', async () => {
    await replaceAllData({});
    expect(mockDb.teachers.clear).not.toHaveBeenCalled();
  });

  it('does NOT clear rooms when array is empty', async () => {
    await replaceAllData({ rooms: [] });
    expect(mockDb.rooms.clear).not.toHaveBeenCalled();
  });

  it('does NOT clear rooms when field is undefined', async () => {
    await replaceAllData({});
    expect(mockDb.rooms.clear).not.toHaveBeenCalled();
  });

  it('does NOT clear classes when array is empty', async () => {
    await replaceAllData({ classes: [] });
    expect(mockDb.classes.clear).not.toHaveBeenCalled();
  });

  it('does NOT clear groups when array is empty', async () => {
    await replaceAllData({ groups: [] });
    expect(mockDb.groups.clear).not.toHaveBeenCalled();
  });

  it('does NOT clear lessonRequirements when array is empty', async () => {
    await replaceAllData({ lessonRequirements: [] });
    expect(mockDb.lessonRequirements.clear).not.toHaveBeenCalled();
  });

  it('replaces only specified non-empty tables, leaves others untouched', async () => {
    await replaceAllData({
      teachers: [{ id: '1', name: 'Петрова А.П.' } as never],
      rooms: [],
    });
    expect(mockDb.teachers.clear).toHaveBeenCalled();
    expect(mockDb.rooms.clear).not.toHaveBeenCalled();
    expect(mockDb.classes.clear).not.toHaveBeenCalled();
  });
});

// ─── clearScheduleData ────────────────────────────────────────────────────────

describe('clearScheduleData', () => {
  it('clears versions, classes, groups, and lessonRequirements', async () => {
    await clearScheduleData();
    expect(mockDb.versions.clear).toHaveBeenCalled();
    expect(mockDb.classes.clear).toHaveBeenCalled();
    expect(mockDb.groups.clear).toHaveBeenCalled();
    expect(mockDb.lessonRequirements.clear).toHaveBeenCalled();
  });

  it('does NOT clear teachers', async () => {
    await clearScheduleData();
    expect(mockDb.teachers.clear).not.toHaveBeenCalled();
  });

  it('does NOT clear rooms', async () => {
    await clearScheduleData();
    expect(mockDb.rooms.clear).not.toHaveBeenCalled();
  });

  it('resets activeTemplateId in settings', async () => {
    await clearScheduleData();
    expect(mockDb.settings.update).toHaveBeenCalledWith('default', { activeTemplateId: null });
  });
});
