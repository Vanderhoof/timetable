/**
 * Date formatting utilities for weekly schedules
 */

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/**
 * Get Friday date from Monday date
 */
function getFriday(monday: Date): Date {
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  return friday;
}

/**
 * Format week range for version list (short format)
 * Example: "3–7 фев" or "28 янв – 1 фев"
 */
export function formatWeekShort(mondayDate: Date | undefined): string {
  if (!mondayDate) return '';

  const monday = new Date(mondayDate);
  const friday = getFriday(monday);

  const monDay = monday.getDate();
  const friDay = friday.getDate();
  const monMonth = monday.getMonth();
  const friMonth = friday.getMonth();

  if (monMonth === friMonth) {
    // Same month: "3–7 фев"
    return `${monDay}–${friDay} ${MONTHS_SHORT[monMonth]}`;
  } else {
    // Different months: "28 янв – 1 фев"
    return `${monDay} ${MONTHS_SHORT[monMonth]} – ${friDay} ${MONTHS_SHORT[friMonth]}`;
  }
}

/**
 * Format week range for editor header (full format)
 * Example: "3–7 февраля 2026" or "28 января – 1 февраля 2026"
 */
export function formatWeekFull(mondayDate: Date | undefined): string {
  if (!mondayDate) return '';

  const monday = new Date(mondayDate);
  const friday = getFriday(monday);

  const monDay = monday.getDate();
  const friDay = friday.getDate();
  const monMonth = monday.getMonth();
  const friMonth = friday.getMonth();
  const year = friday.getFullYear();

  if (monMonth === friMonth) {
    // Same month: "3–7 февраля 2026"
    return `${monDay}–${friDay} ${MONTHS_FULL[monMonth]} ${year}`;
  } else {
    // Different months: "28 января – 1 февраля 2026"
    return `${monDay} ${MONTHS_FULL[monMonth]} – ${friDay} ${MONTHS_FULL[friMonth]} ${year}`;
  }
}

/**
 * Get date for a specific day of the week
 * @param mondayDate The Monday date
 * @param dayIndex 0 = Monday, 1 = Tuesday, etc.
 */
export function getDayDate(mondayDate: Date, dayIndex: number): Date {
  const date = new Date(mondayDate);
  date.setDate(date.getDate() + dayIndex);
  return date;
}

/**
 * Format day header with date (short format)
 * Example: "Пн 03.02"
 */
export function formatDayWithDate(dayName: string, mondayDate: Date | undefined, dayIndex: number): string {
  if (!mondayDate) return dayName;

  const date = getDayDate(new Date(mondayDate), dayIndex);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return `${dayName} ${day}.${month}`;
}

const DAY_FULL_NAMES: Record<string, string> = {
  'Пн': 'Понедельник',
  'Вт': 'Вторник',
  'Ср': 'Среда',
  'Чт': 'Четверг',
  'Пт': 'Пятница',
};

/**
 * Format day header with full name and date
 * Example: "Понедельник 10.02"
 */
export function formatDayFullWithDate(dayName: string, mondayDate: Date | undefined, dayIndex: number): string {
  const fullName = DAY_FULL_NAMES[dayName] || dayName;
  if (!mondayDate) return fullName;

  const date = getDayDate(new Date(mondayDate), dayIndex);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return `${fullName} ${day}.${month}`;
}
