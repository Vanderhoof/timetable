import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { importTeachersFromDataXlsx, parseInitials, parseRoom } from './importTeachers';

function makeDataXlsx(rows: (string | number)[][]): File {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Учителя');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([buf], 'data.xlsx');
}

const SAMPLE_ROWS = [
  ['Фамилия И.О.', 'Кабинет', 'Запреты', 'Предметы'],
  ['Авдеева Н.В.', '-2.10-', 'Вт', ''],
  ['Аккиев М.Н.', '-3.17-', '', ''],
  ['Алимова Е.В.', '', '', ''],
];

describe('parseInitials', () => {
  it('extracts and strips dots: "Авдеева Н.В." → "НВ"', () => {
    expect(parseInitials('Авдеева Н.В.')).toBe('НВ');
  });

  it('extracts and strips dots: "Иванов П.А." → "ПА"', () => {
    expect(parseInitials('Иванов П.А.')).toBe('ПА');
  });

  it('returns empty string if no space', () => {
    expect(parseInitials('Иванов')).toBe('');
  });
});

describe('parseRoom', () => {
  it('strips surrounding dashes: "-2.10-" → "2.10"', () => {
    expect(parseRoom('-2.10-')).toBe('2.10');
  });

  it('strips single leading dash: "-205-" → "205"', () => {
    expect(parseRoom('-205-')).toBe('205');
  });

  it('returns undefined for empty string', () => {
    expect(parseRoom('')).toBeUndefined();
  });

  it('returns undefined for dash-only string', () => {
    expect(parseRoom('---')).toBeUndefined();
  });

  it('returns value unchanged if no surrounding dashes', () => {
    expect(parseRoom('201')).toBe('201');
  });
});

describe('importTeachersFromDataXlsx', () => {
  it('parses teacher names', async () => {
    const teachers = await importTeachersFromDataXlsx(makeDataXlsx(SAMPLE_ROWS));
    expect(teachers.map((t) => t.name)).toEqual(['Авдеева Н.В.', 'Аккиев М.Н.', 'Алимова Е.В.']);
  });

  it('derives initials from name without dots', async () => {
    const teachers = await importTeachersFromDataXlsx(makeDataXlsx(SAMPLE_ROWS));
    expect(teachers[0].initials).toBe('НВ');
    expect(teachers[1].initials).toBe('МН');
  });

  it('parses and cleans room numbers', async () => {
    const teachers = await importTeachersFromDataXlsx(makeDataXlsx(SAMPLE_ROWS));
    expect(teachers[0].defaultRoom).toBe('2.10');
    expect(teachers[1].defaultRoom).toBe('3.17');
  });

  it('leaves defaultRoom undefined when room is empty', async () => {
    const teachers = await importTeachersFromDataXlsx(makeDataXlsx(SAMPLE_ROWS));
    expect(teachers[2].defaultRoom).toBeUndefined();
  });

  it('skips empty rows', async () => {
    const rows = [
      ['Фамилия И.О.', 'Кабинет'],
      ['Авдеева Н.В.', '-205-'],
      ['', ''],
      ['Аккиев М.Н.', ''],
    ];
    const teachers = await importTeachersFromDataXlsx(makeDataXlsx(rows));
    expect(teachers).toHaveLength(2);
  });

  it('assigns unique ids to all teachers', async () => {
    const teachers = await importTeachersFromDataXlsx(makeDataXlsx(SAMPLE_ROWS));
    const ids = teachers.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sets subjects to empty array', async () => {
    const teachers = await importTeachersFromDataXlsx(makeDataXlsx(SAMPLE_ROWS));
    expect(teachers.every((t) => Array.isArray(t.subjects) && t.subjects.length === 0)).toBe(true);
  });

  it('finds sheet by name containing "учител"', async () => {
    const ws = XLSX.utils.aoa_to_sheet(SAMPLE_ROWS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['junk']]), 'Другой');
    XLSX.utils.book_append_sheet(wb, ws, 'Учителя');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const file = new File([buf], 'data.xlsx');
    const teachers = await importTeachersFromDataXlsx(file);
    expect(teachers).toHaveLength(3);
  });
});
