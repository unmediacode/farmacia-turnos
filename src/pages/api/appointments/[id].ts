import type { APIRoute } from 'astro';
import { ensureSchema, getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const PUT: APIRoute = async ({ params, request }) => {
  const authRes = await requireAuth(request);
  if (authRes) return authRes;
  await ensureSchema();
  const db = getDb();
  const id = Number(params.id);
  const body = await request.json();
  const { name, phone, notes } = body as { name?: string; phone?: string; notes?: string };

  const res = await db.execute({
    sql: 'UPDATE appointments SET name = COALESCE(?, name), phone = COALESCE(?, phone), notes = COALESCE(?, notes) WHERE id = ?',
    args: [name ?? null, phone ?? null, notes ?? null, id],
  });

  return new Response(JSON.stringify({ updated: res.rowsAffected }), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const authRes = await requireAuth(request);
  if (authRes) return authRes;
  await ensureSchema();
  const db = getDb();
  const id = Number(params.id);
  const res = await db.execute({ sql: 'DELETE FROM appointments WHERE id = ?', args: [id] });
  return new Response(JSON.stringify({ deleted: res.rowsAffected }), { status: 200 });
};
