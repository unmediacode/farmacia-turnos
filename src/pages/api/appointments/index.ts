import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { json, jsonError } from '@/lib/response';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, extractClientKey } from '@/lib/rate-limit';
import {
  ISO_DATE_FORMAT,
  MAX_APPOINTMENTS_PER_DAY,
  dayjs,
  buildWorkWeek
} from '@/lib/utils/date';
import {
  buildLimitReachedMessage,
  createAppointmentSchema,
  listQuerySchema
} from '@/lib/validation/appointments';

const NO_STORE_HEADER = { 'cache-control': 'no-store' } as const;

type RawRow = Record<string, unknown>;

type ExecuteResult = {
  rows: RawRow[];
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function mapCounts(result: ExecuteResult): { date: string; count: number }[] {
  return result.rows.map((row) => ({
    date: asString(row['date']),
    count: asNumber(row['count'] ?? row['c'])
  }));
}

function mapAppointments(
  result: ExecuteResult
): {
  id: number;
  date: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
}[] {
  return result.rows.map((row) => ({
    id: asNumber(row['id']),
    date: asString(row['date']),
    name: asString(row['name']),
    phone: asNullableString(row['phone']),
    notes: asNullableString(row['notes']),
    created_at: asNullableString(row['created_at'])
  }));
}

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  const parsed = listQuerySchema.safeParse(params);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError(issue?.message ?? 'Parámetros inválidos', 400);
  }

  const { day, week, month, start, end } = parsed.data;

  if (start && end) {
    const rows = await db.execute({
      sql: 'SELECT date, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY date',
      args: [start, end]
    });
    return json(mapCounts(rows), { status: 200, headers: NO_STORE_HEADER });
  }

  if (day) {
    const rows = await db.execute({
      sql: 'SELECT * FROM appointments WHERE date = ? ORDER BY created_at ASC',
      args: [day]
    });
    return json(mapAppointments(rows), { status: 200, headers: NO_STORE_HEADER });
  }

  if (week) {
    const workWeek = buildWorkWeek(week);
    const startOfWeek = workWeek[0];
    const endOfWeek = workWeek[workWeek.length - 1];
    if (!startOfWeek || !endOfWeek) {
      return jsonError('Semana inválida.', 400);
    }
    const rows = await db.execute({
      sql: 'SELECT date, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY date',
      args: [startOfWeek, endOfWeek]
    });
    return json(mapCounts(rows), { status: 200, headers: NO_STORE_HEADER });
  }

  if (month) {
    const base = dayjs(`${month}-01`, ISO_DATE_FORMAT, true);
    if (!base.isValid()) {
      return jsonError('Mes inválido.', 400);
    }
    const startOfMonth = base.startOf('month').format(ISO_DATE_FORMAT);
    const endOfMonth = base.endOf('month').format(ISO_DATE_FORMAT);
    const rows = await db.execute({
      sql: 'SELECT date, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY date',
      args: [startOfMonth, endOfMonth]
    });
    return json(mapCounts(rows), { status: 200, headers: NO_STORE_HEADER });
  }

  return jsonError('Especifica day, week, month o start/end', 400);
};

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;

  const rateKey = extractClientKey(request);
  const rate = checkRateLimit(rateKey, { windowMs: 60_000, maxRequests: 30 });
  if (!rate.ok) {
    return jsonError('Demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.', 429, {
      headers: { 'retry-after': String(rate.retryAfter) }
    });
  }

  const parsedBody = await parseJsonBody(request, createAppointmentSchema);
  if (!parsedBody.success) return parsedBody.error;

  const { date, name, phone, notes } = parsedBody.data;
  const db = getDb();

  const currentCount = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM appointments WHERE date = ?',
    args: [date]
  });
  const countValue = asNumber((currentCount.rows[0] as RawRow)?.['count']);
  if (countValue >= MAX_APPOINTMENTS_PER_DAY) {
    return jsonError(buildLimitReachedMessage(date), 409);
  }

  const insert = await db.execute({
    sql: 'INSERT INTO appointments (date, name, phone, notes) VALUES (?, ?, ?, ?)',
    args: [date, name, phone ?? null, notes ?? null]
  });

  const id = insert.lastInsertRowid !== undefined ? Number(insert.lastInsertRowid) : null;
  return json({ id }, { status: 201 });
};
