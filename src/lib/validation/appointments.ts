import { z } from 'zod';
import {
  ISO_DATE_FORMAT,
  MAX_APPOINTMENTS_PER_DAY,
  formatHuman,
  isValidDateKey,
  isWeekday,
  toDateKey
} from '@/lib/utils/date';

const dateKeySchema = z
  .string({ required_error: 'La fecha es obligatoria.' })
  .trim()
  .refine((value) => isValidDateKey(value), {
    message: `La fecha debe seguir el formato ${ISO_DATE_FORMAT}.`
  })
  .transform((value) => toDateKey(value))
  .refine((value) => isWeekday(value), {
    message: 'Solo se permiten citas de lunes a viernes.'
  });

const nameSchema = z
  .string({ required_error: 'El nombre es obligatorio.' })
  .trim()
  .min(1, 'El nombre es obligatorio.')
  .max(120, 'El nombre es demasiado largo.');

const phoneSchema = z
  .string()
  .trim()
  .max(30, 'El teléfono no puede superar los 30 caracteres.')
  .regex(/^[+\d\s-]*$/, 'Introduce un teléfono válido.')
  .optional()
  .transform((value) => (value ? value : undefined));

const notesSchema = z
  .string()
  .trim()
  .max(500, 'Las notas no pueden superar los 500 caracteres.')
  .optional()
  .transform((value) => (value ? value : undefined));

export const createAppointmentSchema = z
  .object({
    date: dateKeySchema,
    name: nameSchema,
    phone: phoneSchema,
    notes: notesSchema
  })
  .strict();

export const updateAppointmentSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema,
    notes: notesSchema
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Indica al menos un campo para actualizar.'
  });

export const listQuerySchema = z
  .object({
    day: z.string().optional(),
    week: z.string().optional(),
    month: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}$/)
      .optional(),
    start: z.string().optional(),
    end: z.string().optional()
  })
  .refine((params) => {
    const keys = [
      params.day ? 'day' : null,
      params.week ? 'week' : null,
      params.month ? 'month' : null,
      params.start || params.end ? 'range' : null
    ].filter(Boolean);
    return new Set(keys).size <= 1;
  }, { message: 'Indica un único filtro (day, week, month o start/end).' })
  .refine((params) => {
    if (params.start || params.end) {
      return Boolean(params.start && params.end && isValidDateKey(params.start) && isValidDateKey(params.end));
    }
    return true;
  }, { message: 'Rango inválido: start y end deben estar definidos con formato YYYY-MM-DD.' })
  .superRefine((params, ctx) => {
    if (params.day && !isValidDateKey(params.day)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['day'],
        message: 'El parámetro day debe tener formato YYYY-MM-DD.'
      });
    }
    if (params.week && !isValidDateKey(params.week)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['week'],
        message: 'El parámetro week debe tener formato YYYY-MM-DD.'
      });
    }
    if (params.month) {
      const [yearPart, monthPart] = params.month.split('-');
      const year = Number(yearPart);
      const monthRaw = Number(monthPart ?? NaN);
      if (Number.isNaN(year) || Number.isNaN(monthRaw) || monthRaw < 1 || monthRaw > 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['month'],
          message: 'El parámetro month debe tener un mes válido.'
        });
      }
    }
  });

export function buildLimitReachedMessage(date: string): string {
  return `Límite de ${MAX_APPOINTMENTS_PER_DAY} turnos alcanzado para ${formatHuman(date)}.`;
}
