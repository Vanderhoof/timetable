/**
 * Tests for date formatting utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatWeekShort,
  formatWeekFull,
  getDayDate,
  formatDayWithDate,
  formatDayFullWithDate,
} from './dateFormat';

describe('formatWeekShort', () => {
  it('formats same-month week', () => {
    // Monday Feb 3, 2026 → Friday Feb 7
    const monday = new Date(2026, 1, 3);
    expect(formatWeekShort(monday)).toBe('3–7 фев');
  });

  it('formats cross-month week', () => {
    // Monday Jan 28, 2026 → Friday Feb 1
    const monday = new Date(2026, 0, 28);
    expect(formatWeekShort(monday)).toBe('28 янв – 1 фев');
  });

  it('returns empty string for undefined', () => {
    expect(formatWeekShort(undefined)).toBe('');
  });
});

describe('formatWeekFull', () => {
  it('formats same-month week with year', () => {
    const monday = new Date(2026, 1, 3);
    expect(formatWeekFull(monday)).toBe('3–7 февраля 2026');
  });

  it('formats cross-month week with year', () => {
    const monday = new Date(2026, 0, 28);
    expect(formatWeekFull(monday)).toBe('28 января – 1 февраля 2026');
  });

  it('returns empty string for undefined', () => {
    expect(formatWeekFull(undefined)).toBe('');
  });
});

describe('getDayDate', () => {
  it('returns Monday for dayIndex 0', () => {
    const monday = new Date(2026, 1, 9);
    const result = getDayDate(monday, 0);
    expect(result.getDate()).toBe(9);
  });

  it('returns Friday for dayIndex 4', () => {
    const monday = new Date(2026, 1, 9);
    const result = getDayDate(monday, 4);
    expect(result.getDate()).toBe(13);
  });

  it('handles month boundary', () => {
    const monday = new Date(2026, 0, 28);
    const result = getDayDate(monday, 4); // Friday Feb 1
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
  });
});

describe('formatDayWithDate', () => {
  it('formats day with short date', () => {
    const monday = new Date(2026, 1, 9);
    expect(formatDayWithDate('Пн', monday, 0)).toBe('Пн 09.02');
  });

  it('formats Wednesday with date', () => {
    const monday = new Date(2026, 1, 9);
    expect(formatDayWithDate('Ср', monday, 2)).toBe('Ср 11.02');
  });

  it('returns just day name when no date', () => {
    expect(formatDayWithDate('Пн', undefined, 0)).toBe('Пн');
  });
});

describe('formatDayFullWithDate', () => {
  it('formats with full day name', () => {
    const monday = new Date(2026, 1, 9);
    expect(formatDayFullWithDate('Пн', monday, 0)).toBe('Понедельник 09.02');
  });

  it('formats all day names', () => {
    const monday = new Date(2026, 1, 9);
    expect(formatDayFullWithDate('Вт', monday, 1)).toBe('Вторник 10.02');
    expect(formatDayFullWithDate('Ср', monday, 2)).toBe('Среда 11.02');
    expect(formatDayFullWithDate('Чт', monday, 3)).toBe('Четверг 12.02');
    expect(formatDayFullWithDate('Пт', monday, 4)).toBe('Пятница 13.02');
  });

  it('returns full name without date when no monday date', () => {
    expect(formatDayFullWithDate('Пн', undefined, 0)).toBe('Понедельник');
  });

  it('passes through unknown day names', () => {
    expect(formatDayFullWithDate('Сб', undefined, 5)).toBe('Сб');
  });
});
