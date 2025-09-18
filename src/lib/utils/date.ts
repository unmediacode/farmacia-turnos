import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(isBetween);

export { dayjs };

export function toDateKey(d: Date | string) {
  const dt = typeof d === 'string' ? dayjs(d) : dayjs(d);
  return dt.format('YYYY-MM-DD');
}

export function isWeekday(d: Date | string) {
  const dt = typeof d === 'string' ? dayjs(d) : dayjs(d);
  const dow = dt.day();
  return dow >= 1 && dow <= 5; // lunes a viernes
}

export function monthGrid(year: number, month0: number) {
  const start = dayjs().year(year).month(month0).date(1);
  const end = start.endOf('month');

  // Start from Monday grid
  const gridStart = start.weekday() === 0 ? start.subtract(6, 'day') : start.weekday(1);
  const gridEnd = end.weekday(0).add(7, 'day');
  const days: string[] = [];
  let cur = gridStart;
  while (cur.isBefore(gridEnd) || cur.isSame(gridEnd, 'day')) {
    days.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
  }
  return days;
}

export function weekDays(dateKey: string) {
  const d = dayjs(dateKey);
  const monday = d.weekday(1);
  return Array.from({ length: 5 }, (_, i) => monday.add(i, 'day').format('YYYY-MM-DD'));
}
