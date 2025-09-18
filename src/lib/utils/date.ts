import dayjsLib from 'dayjs';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import weekday from 'dayjs/plugin/weekday.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjsLib.extend(isoWeek);
dayjsLib.extend(weekday);
dayjsLib.extend(isBetween);
dayjsLib.extend(utc);
dayjsLib.extend(timezone);
dayjsLib.locale('es');
dayjsLib.tz.setDefault('Europe/Madrid');

export const dayjs = dayjsLib;

export const ISO_DATE_FORMAT = 'YYYY-MM-DD';
export const HUMAN_DATE_FORMAT = 'DD/MM/YYYY';
export const TIMEZONE = 'Europe/Madrid';
export const WORKING_DAYS = [1, 2, 3, 4, 5] as const; // 1 = Monday
export const MAX_APPOINTMENTS_PER_DAY = 10;

export type DateKey = string;

type DayInput = string | Date | Dayjs;

function monthStartKey(year: number, monthIndex: number): string {
  const normalizedMonth = String(monthIndex + 1).padStart(2, '0');
  return `${year}-${normalizedMonth}-01`;
}

export function toDateKey(input: DayInput): DateKey {
  return dayjsLib(input).tz(TIMEZONE).format(ISO_DATE_FORMAT);
}

export function parseDay(input: DayInput): Dayjs {
  return dayjsLib(input).tz(TIMEZONE);
}

export function isWeekday(input: DayInput): boolean {
  const dow = parseDay(input).isoWeekday();
  return WORKING_DAYS.includes(dow as (typeof WORKING_DAYS)[number]);
}

export function ensureWeekday(input: DayInput): void {
  if (!isWeekday(input)) {
    throw new Error('Solo se permiten días laborables (lunes a viernes).');
  }
}

export function buildMonthGrid(year: number, monthIndex: number): DateKey[] {
  const startOfMonth = dayjsLib.tz(monthStartKey(year, monthIndex), TIMEZONE).startOf('day');
  const endOfMonth = startOfMonth.endOf('month');

  const startDow = startOfMonth.day();
  const daysToSubtract = (startDow + 6) % 7; // transforms Monday=0 ... Sunday=6
  const gridStart = startOfMonth.subtract(daysToSubtract, 'day');

  const endDow = endOfMonth.day();
  const daysToAdd = endDow === 0 ? 0 : 7 - endDow;
  const gridEnd = endOfMonth.add(daysToAdd, 'day');

  let cursor: Dayjs = gridStart;
  const days: DateKey[] = [];
  while (cursor.isSame(gridEnd, 'day') || cursor.isBefore(gridEnd, 'day')) {
    days.push(cursor.format(ISO_DATE_FORMAT));
    cursor = cursor.add(1, 'day');
  }
  return days;
}

export function buildWorkWeek(anchor: DayInput): DateKey[] {
  const monday = parseDay(anchor).isoWeekday(1);
  return WORKING_DAYS.map((_, idx) => monday.clone().add(idx, 'day').format(ISO_DATE_FORMAT));
}

export function buildRemainingWorkWeeks(anchor: DayInput): DateKey[][] {
  const monthStart = parseDay(anchor).startOf('month');
  const monthEnd = monthStart.endOf('month');
  const selectedWeekStart = parseDay(anchor).startOf('isoWeek');
  let weekCursor = monthStart.startOf('isoWeek');
  const weeks: DateKey[][] = [];

  while (weekCursor.isBefore(monthEnd) || weekCursor.isSame(monthEnd, 'day')) {
    if (!weekCursor.isBefore(selectedWeekStart)) {
      const weekDays = WORKING_DAYS.map((_, idx) =>
        weekCursor.add(idx, 'day').format(ISO_DATE_FORMAT)
      );
      weeks.push(weekDays);
    }
    weekCursor = weekCursor.add(1, 'week');
  }

  return weeks;
}

export function formatHuman(input: DayInput, format = HUMAN_DATE_FORMAT): string {
  return parseDay(input).format(format);
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [yearPart, monthPart, dayPart] = value.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  return dayjsLib(value, ISO_DATE_FORMAT, true).isValid();
}
