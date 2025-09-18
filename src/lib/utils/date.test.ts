import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  buildRemainingWorkWeeks,
  buildWorkWeek,
  ensureWeekday,
  isValidDateKey,
  isWeekday,
  toDateKey
} from './date';

describe('date utilities', () => {
  it('normalises a Date into YYYY-MM-DD format', () => {
    const key = toDateKey(new Date('2024-03-05T10:10:00Z'));
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('detects weekdays correctly', () => {
    expect(isWeekday('2024-09-09')).toBe(true); // lunes
    expect(isWeekday('2024-09-14')).toBe(false); // sábado
  });

  it('throws when ensuring a non-weekday', () => {
    expect(() => ensureWeekday('2024-09-14')).toThrow('Solo se permiten días laborables');
  });

  it('builds a work week starting on Monday', () => {
    const week = buildWorkWeek('2024-07-03');
    expect(week).toHaveLength(5);
    expect(week[0]).toBe('2024-07-01');
    expect(week[4]).toBe('2024-07-05');
  });

  it('generates a month grid covering complete weeks', () => {
    const grid = buildMonthGrid(2024, 1); // febrero 2024
    expect(grid.length % 7).toBe(0);
    expect(grid[0]).toMatch(/2024-01/); // comienza en la semana previa
    expect(grid[grid.length - 1]).toMatch(/2024-03/); // termina en la semana siguiente
  });

  it('validates date keys', () => {
    expect(isValidDateKey('2024-12-01')).toBe(true);
    expect(isValidDateKey('2024-13-01')).toBe(false);
    expect(isValidDateKey('2024-12-32')).toBe(false);
  });

  it('builds remaining work weeks within the month', () => {
    const weeks = buildRemainingWorkWeeks('2024-07-10');
    expect(weeks).toHaveLength(4);
    const firstWeek = weeks[0]!;
    expect(firstWeek[0]).toBe('2024-07-08');
    const lastWeek = weeks[weeks.length - 1]!;
    expect(lastWeek[lastWeek.length - 1]).toBe('2024-08-02');
  });
});
