import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db';
import { dayjs } from '@/lib/utils/date';
import { requireAuth } from '@/lib/auth';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const month = url.searchParams.get('month'); // YYYY-MM
  const week = url.searchParams.get('week'); // YYYY-MM-DD within week
  const day = url.searchParams.get('day'); // YYYY-MM-DD
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (start && end) {
    const rows = await db.execute({
      sql: 'SELECT date, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY date',
      args: [start, end],
    });
    return new Response(JSON.stringify(rows.rows), { status: 200 });
  }

  if (day) {
    const rows = await db.execute({
      sql: 'SELECT * FROM appointments WHERE date = ? ORDER BY created_at ASC',
      args: [day],
    });
    return new Response(JSON.stringify(rows.rows), { status: 200 });
  }

  if (week) {
    const d = dayjs(week).weekday(1);
    const start = d.format('YYYY-MM-DD');
    const end = d.add(4, 'day').format('YYYY-MM-DD');
    const rows = await db.execute({
      sql: 'SELECT date, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY date',
      args: [start, end],
    });
    return new Response(JSON.stringify(rows.rows), { status: 200 });
  }

  if (month) {
    const start = dayjs(month + '-01').startOf('month').format('YYYY-MM-DD');
    const end = dayjs(month + '-01').endOf('month').format('YYYY-MM-DD');
    const rows = await db.execute({
      sql: 'SELECT date, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY date',
      args: [start, end],
    });
    return new Response(JSON.stringify(rows.rows), { status: 200 });
  }

  return new Response(JSON.stringify({ error: 'Specify day, week or month' }), { status: 400 });
};

export const POST: APIRoute = async ({ request }) => {
  const authRes = await requireAuth(request);
  if (authRes) return authRes;
  const db = getDb();
  const data = await request.json();
  const { date, name, phone, notes } = data as { date: string; name: string; phone?: string; notes?: string };

  if (!date || !name) return new Response(JSON.stringify({ error: 'date and name are required' }), { status: 400 });

  // enforce weekdays only
  const dow = dayjs(date).day();
  if (dow === 0 || dow === 6) return new Response(JSON.stringify({ error: 'Only Monday to Friday allowed' }), { status: 400 });

  // limit 10 per day
  const countRes = await db.execute({ sql: 'SELECT COUNT(*) as c FROM appointments WHERE date = ?', args: [date] });
  const c = Number((countRes.rows[0] as any).c ?? 0);
  if (c >= 10) return new Response(JSON.stringify({ error: 'Limit of 10 customers per day reached' }), { status: 409 });

  const res = await db.execute({
    sql: 'INSERT INTO appointments (date, name, phone, notes) VALUES (?, ?, ?, ?)',
    args: [date, name, phone ?? null, notes ?? null],
  });

  const id = res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : null;
  return new Response(JSON.stringify({ id }), { status: 201 });
};
