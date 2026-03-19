/**
 * Renders the workload report (нагрузка учителей) as a printable HTML page
 * and opens it in a new browser window.
 *
 * Format matches the school's existing нагрузка document:
 * - Table grouped by subject (yellow rowspan cell on the left)
 * - Columns: Subject / Teacher / Кл.рук / 5–9 / 10–11 / Hours
 */

import type { SubjectBlock } from './workloadReport';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildHtml(blocks: SubjectBlock[]): string {
  const rows: string[] = [];

  for (const block of blocks) {
    if (block.teachers.length === 0) continue;
    const rs = block.teachers.length;

    block.teachers.forEach((t, i) => {
      const subjectCell =
        i === 0
          ? `<td class="subj" rowspan="${rs}"><strong>${esc(block.subjectName)}</strong><br><small>Всего: ${block.totalHours} ч.</small></td>`
          : '';
      rows.push(`
        <tr>
          ${subjectCell}
          <td>${esc(t.teacherName)}</td>
          <td class="c">${esc(t.homeroomClass)}</td>
          <td>${esc(t.classes59)}</td>
          <td>${esc(t.classes1011)}</td>
          <td class="c">${t.totalHours}</td>
        </tr>`);
    });

    rows.push('<tr class="gap"><td colspan="6"></td></tr>');
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Нагрузка учителей</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
  h2 { text-align: center; margin: 0 0 2px; font-size: 14px; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  th { background: #d0d0d0; padding: 5px 7px; border: 1px solid #555;
       text-align: center; font-size: 11px; }
  td { border: 1px solid #888; padding: 4px 6px; vertical-align: top; font-size: 11px; }
  .subj { background: #ffff00; min-width: 130px; max-width: 170px; }
  .c { text-align: center; }
  .gap td { border: none; height: 4px; background: #fff; padding: 0; }
  .btn { padding: 8px 24px; font-size: 14px; cursor: pointer; }
  .actions { margin-top: 16px; text-align: center; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .actions { display: none; }
  }
</style>
</head>
<body>
<h2>Нагрузка учителей</h2>
<table>
  <thead>
    <tr>
      <th style="width:160px">Предмет<br>Общее к-во часов</th>
      <th>Учитель</th>
      <th style="width:55px">Кл.<br>рук.</th>
      <th>Классы 5–9</th>
      <th>Классы 10–11</th>
      <th style="width:50px">Часов</th>
    </tr>
  </thead>
  <tbody>
    ${rows.join('')}
  </tbody>
</table>
<div class="actions">
  <button class="btn" onclick="window.print()">Печать / Сохранить PDF</button>
  <button class="btn" onclick="window.close()" style="margin-left:12px">Закрыть</button>
</div>
</body>
</html>`;
}

export function printWorkloadReport(blocks: SubjectBlock[]): void {
  const html = buildHtml(blocks);
  const w = window.open('', '_blank');
  if (!w) {
    alert('Не удалось открыть окно печати. Разрешите всплывающие окна для этой страницы.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
