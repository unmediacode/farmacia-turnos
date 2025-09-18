import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(isBetween);
dayjs.locale('es');

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
  const startOfMonth = dayjs().year(year).month(month0).startOf('month');
  const endOfMonth = startOfMonth.endOf('month');

  const startDow = startOfMonth.day();
  const gridStart = startDow === 0 ? startOfMonth.subtract(6, 'day') : startOfMonth.subtract(startDow - 1, 'day');

  const endDow = endOfMonth.day();
  const gridEnd = endDow === 0 ? endOfMonth : endOfMonth.add(7 - endDow, 'day');

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
  const dow = d.day();
  const monday = dow === 0 ? d.subtract(6, 'day') : d.subtract(dow - 1, 'day');
  return Array.from({ length: 5 }, (_, i) => monday.add(i, 'day').format('YYYY-MM-DD'));
}
