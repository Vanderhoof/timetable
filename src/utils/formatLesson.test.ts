/**
 * Tests for lesson formatting utilities
 */

import { describe, it, expect } from 'vitest';
import {
  extractGroupIndex,
  formatLessonCell,
  formatLessonByTeacher,
  formatLessonByRoom,
  formatLessonDisplay,
  formatRoom,
  compareClassNames,
  escapeHtml,
} from './formatLesson';

describe('compareClassNames', () => {
  it('sorts numerically: 5а before 11в', () => {
    const names = ['11в', '5а', '9б', '1а'];
    expect(names.sort(compareClassNames)).toEqual(['1а', '5а', '9б', '11в']);
  });

  it('sorts letters within same grade', () => {
    const names = ['5в', '5а', '5б'];
    expect(names.sort(compareClassNames)).toEqual(['5а', '5б', '5в']);
  });

  it('puts non-numeric names last', () => {
    const names = ['Иванов', '3а', '10б'];
    expect(names.sort(compareClassNames)).toEqual(['3а', '10б', 'Иванов']);
  });
});

describe('formatRoom', () => {
  it('should add dashes to room without them', () => {
    expect(formatRoom('114')).toBe('-114-');
  });

  it('should not double-wrap room that already has dashes', () => {
    expect(formatRoom('-114-')).toBe('-114-');
  });

  it('should handle room with only leading dash', () => {
    expect(formatRoom('-114')).toBe('--114-');
  });
});

describe('extractGroupIndex', () => {
  it('extracts content from parentheses', () => {
    expect(extractGroupIndex('10а(В.Е.)')).toBe('В.Е.');
  });

  it('returns whole string when no parentheses', () => {
    expect(extractGroupIndex('д')).toBe('д');
  });

  it('returns undefined for undefined input', () => {
    expect(extractGroupIndex(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(extractGroupIndex('')).toBeUndefined();
  });

  it('extracts from complex group names', () => {
    expect(extractGroupIndex('10а(1)')).toBe('1');
  });
});

describe('formatLessonCell', () => {
  it('formats basic lesson', () => {
    expect(formatLessonCell('Математика', 'Иванова Т.С.', '114'))
      .toBe('Математика Иванова Т.С. -114-');
  });

  it('formats lesson with group', () => {
    expect(formatLessonCell('Английский', 'Петрова А.П.', '206', '10а(В.Е.)'))
      .toBe('Английский (В.Е.) Петрова А.П. -206-');
  });

  it('formats lesson without group', () => {
    expect(formatLessonCell('Физика', 'Сидоров И.В.', '301'))
      .toBe('Физика Сидоров И.В. -301-');
  });
});

describe('formatLessonByTeacher', () => {
  it('formats class, subject, room', () => {
    expect(formatLessonByTeacher('10а', 'Математика', '114'))
      .toBe('10а Математика -114-');
  });

  it('includes group index', () => {
    expect(formatLessonByTeacher('10а', 'Английский', '206', '10а(В.Е.)'))
      .toBe('10а (В.Е.) Английский -206-');
  });
});

describe('formatLessonByRoom', () => {
  it('formats class, subject, teacher', () => {
    expect(formatLessonByRoom('10а', 'Математика', 'Иванова Т.С.'))
      .toBe('10а Математика Иванова Т.С.');
  });

  it('includes group index', () => {
    expect(formatLessonByRoom('10а', 'Английский', 'Петрова А.П.', '10а(В.Е.)'))
      .toBe('10а (В.Е.) Английский Петрова А.П.');
  });
});

describe('formatLessonDisplay', () => {
  it('formats full mode', () => {
    const { formatted } = formatLessonDisplay({
      subject: 'Математика',
      teacher: 'Иванова Т.С.',
      room: '114',
    }, 'full');
    expect(formatted).toBe('Математика Иванова Т.С. -114-');
  });

  it('formats full mode with group', () => {
    const { formatted } = formatLessonDisplay({
      subject: 'Английский',
      groupIndex: '10а(В.Е.)',
      teacher: 'Петрова А.П.',
      room: '206',
    }, 'full');
    expect(formatted).toBe('Английский (В.Е.) Петрова А.П. -206-');
  });

  it('formats by-teacher mode', () => {
    const { formatted } = formatLessonDisplay({
      subject: 'Математика',
      className: '10а',
      room: '114',
    }, 'by-teacher');
    expect(formatted).toBe('10а Математика -114-');
  });

  it('formats by-room mode', () => {
    const { formatted } = formatLessonDisplay({
      subject: 'Математика',
      className: '10а',
      teacher: 'Иванова Т.С.',
    }, 'by-room');
    expect(formatted).toBe('10а Математика Иванова Т.С.');
  });

  it('defaults to full mode', () => {
    const { formatted } = formatLessonDisplay({
      subject: 'Физика',
      teacher: 'Сидоров И.В.',
      room: '301',
    });
    expect(formatted).toBe('Физика Сидоров И.В. -301-');
  });
});

// ─── escapeHtml ───────────────────────────────────────────────

describe('escapeHtml', () => {
  it('leaves plain text unchanged', () => {
    expect(escapeHtml('ОПД Бебешина Н.М. -203-')).toBe('ОПД Бебешина Н.М. -203-');
  });

  it('escapes &', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes <', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes >', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes multiple occurrences', () => {
    expect(escapeHtml('<b>bold & italic</b>')).toBe('&lt;b&gt;bold &amp; italic&lt;/b&gt;');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});
