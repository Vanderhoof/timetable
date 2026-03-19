import { describe, it, expect } from 'vitest';
import { buildHtml } from './printReport';
import type { SubjectBlock } from './workloadReport';

const block = (overrides: Partial<SubjectBlock> = {}): SubjectBlock => ({
  subjectName: 'Математика',
  totalHours: 10,
  teachers: [
    { teacherName: 'Иванов Иван Иванович', homeroomClass: '5-а', classes59: '5-а(5)', classes1011: '', totalHours: 5 },
    { teacherName: 'Петрова Анна Сергеевна', homeroomClass: '', classes59: '', classes1011: '10-б(5)', totalHours: 5 },
  ],
  ...overrides,
});

describe('buildHtml', () => {
  it('produces valid HTML document structure', () => {
    const html = buildHtml([block()]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<table>');
    expect(html).toContain('</table>');
    expect(html).toContain('Нагрузка учителей');
  });

  it('includes subject name and total hours', () => {
    const html = buildHtml([block()]);
    expect(html).toContain('Математика');
    expect(html).toContain('Всего: 10 ч.');
  });

  it('applies rowspan equal to teacher count', () => {
    const html = buildHtml([block()]);
    expect(html).toContain('rowspan="2"');
  });

  it('rowspan=1 for single-teacher block', () => {
    const b = block({ teachers: [block().teachers[0]] });
    const html = buildHtml([b]);
    expect(html).toContain('rowspan="1"');
  });

  it('includes teacher names', () => {
    const html = buildHtml([block()]);
    expect(html).toContain('Иванов Иван Иванович');
    expect(html).toContain('Петрова Анна Сергеевна');
  });

  it('includes homeroom class and class lists', () => {
    const html = buildHtml([block()]);
    expect(html).toContain('5-а');
    expect(html).toContain('10-б(5)');
  });

  it('escapes HTML special characters in subject name', () => {
    const b = block({ subjectName: 'ОБЖ & <Право>' });
    const html = buildHtml([b]);
    expect(html).toContain('ОБЖ &amp; &lt;Право&gt;');
    expect(html).not.toContain('<Право>');
  });

  it('escapes HTML special characters in teacher name', () => {
    const b = block({
      teachers: [{ teacherName: 'Иванов <И>', homeroomClass: '', classes59: '', classes1011: '', totalHours: 5 }],
    });
    const html = buildHtml([b]);
    expect(html).toContain('Иванов &lt;И&gt;');
  });

  it('skips blocks with no teachers', () => {
    const html = buildHtml([block({ teachers: [] })]);
    expect(html).not.toContain('Математика');
  });

  it('renders multiple subject blocks', () => {
    const html = buildHtml([
      block({ subjectName: 'Математика' }),
      block({ subjectName: 'Физика' }),
    ]);
    expect(html).toContain('Математика');
    expect(html).toContain('Физика');
  });

  it('adds a gap row between blocks', () => {
    const html = buildHtml([block(), block({ subjectName: 'Физика' })]);
    expect(html.match(/class="gap"/g)?.length).toBe(2);
  });

  it('returns valid HTML for empty input', () => {
    const html = buildHtml([]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<tbody>');
  });
});
