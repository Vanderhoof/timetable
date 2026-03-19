import { describe, it, expect } from 'vitest';
import { deriveInitials, migrateInitials, groupName, groupPairNames, shortTeacherName } from './groupNames';

describe('deriveInitials', () => {
  it('derives two letters from full three-part name', () => {
    expect(deriveInitials('Арутюнян Лариса Вадимовна')).toBe('ЛВ');
  });

  it('derives one letter from two-part name', () => {
    expect(deriveInitials('Юрова Вера')).toBe('В');
  });

  it('handles single word', () => {
    expect(deriveInitials('Иванов')).toBe('И');
  });

  it('handles extra whitespace', () => {
    expect(deriveInitials('  Петров  Андрей  Николаевич  ')).toBe('АН');
  });
});

describe('migrateInitials', () => {
  it('strips dots from old format: "Н.В." → "НВ"', () => {
    expect(migrateInitials('Н.В.')).toBe('НВ');
  });

  it('leaves already-correct format unchanged: "НВ" → "НВ"', () => {
    expect(migrateInitials('НВ')).toBe('НВ');
  });

  it('strips single dot: "А." → "А"', () => {
    expect(migrateInitials('А.')).toBe('А');
  });
});

describe('groupName', () => {
  it('formats correctly', () => {
    expect(groupName('5-а', 'ЛВ')).toBe('5-а (ЛВ)');
  });
});

describe('shortTeacherName', () => {
  it('formats three-part name as Фамилия И.О.', () => {
    expect(shortTeacherName('Алимова Евгения Владимировна')).toBe('Алимова Е.В.');
  });

  it('formats two-part name as Фамилия И.', () => {
    expect(shortTeacherName('Юрова Вера')).toBe('Юрова В.');
  });

  it('returns single-word name unchanged', () => {
    expect(shortTeacherName('Иванов')).toBe('Иванов');
  });

  it('handles extra whitespace', () => {
    expect(shortTeacherName('  Арутюнян  Лариса  Вадимовна  ')).toBe('Арутюнян Л.В.');
  });
});

describe('groupPairNames', () => {
  it('returns both group names', () => {
    const [a, b] = groupPairNames('5-а', 'ЛВ', 'АН');
    expect(a).toBe('5-а (ЛВ)');
    expect(b).toBe('5-а (АН)');
  });
});
