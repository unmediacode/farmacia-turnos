import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { json, jsonError } from '@/lib/response';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, extractClientKey } from '@/lib/rate-limit';
import { updateAppointmentSchema } from '@/lib/validation/appointments';

const NO_STORE_HEADER = { 'cache-control': 'no-store' } as const;

function parseId(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export const PUT: APIRoute = async ({ params, request }) => {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;

  const id = parseId(params['id']);
  if (id === null) {
    return jsonError('Identificador inválido.', 400);
  }

  const rateKey = `${extractClientKey(request)}:put`;
  const rate = checkRateLimit(rateKey, { windowMs: 60_000, maxRequests: 30 });
  if (!rate.ok) {
    return jsonError('Demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.', 429, {
      headers: { 'retry-after': String(rate.retryAfter) }
    });
  }

  const parsedBody = await parseJsonBody(request, updateAppointmentSchema);
  if (!parsedBody.success) return parsedBody.error;

  const { name, phone, notes } = parsedBody.data;
  const db = getDb();

  const res = await db.execute({
    sql: `UPDATE appointments
          SET name = COALESCE(?, name),
              phone = COALESCE(?, phone),
              notes = COALESCE(?, notes)
          WHERE id = ?`,
    args: [name ?? null, phone ?? null, notes ?? null, id]
  });

  if ((res.rowsAffected ?? 0) === 0) {
    return jsonError('Cita no encontrada.', 404);
  }

  return json({ updated: res.rowsAffected ?? 0 }, { status: 200, headers: NO_STORE_HEADER });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;

  const id = parseId(params['id']);
  if (id === null) {
    return jsonError('Identificador inválido.', 400);
  }

  const rateKey = `${extractClientKey(request)}:delete`;
  const rate = checkRateLimit(rateKey, { windowMs: 60_000, maxRequests: 30 });
  if (!rate.ok) {
    return jsonError('Demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.', 429, {
      headers: { 'retry-after': String(rate.retryAfter) }
    });
  }

  const db = getDb();
  const res = await db.execute({ sql: 'DELETE FROM appointments WHERE id = ?', args: [id] });

  if ((res.rowsAffected ?? 0) === 0) {
    return jsonError('Cita no encontrada.', 404);
  }

  return json({ deleted: res.rowsAffected ?? 0 }, { status: 200, headers: NO_STORE_HEADER });
};
