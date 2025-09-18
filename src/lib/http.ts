import type { ZodSchema } from 'zod';
import { json } from './response';

const DEFAULT_MAX_BODY_BYTES = 8_192; // 8KB, suficiente para payloads pequeños

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
  { maxBytes = DEFAULT_MAX_BODY_BYTES }: { maxBytes?: number } = {}
): Promise<{ success: true; data: T } | { success: false; error: Response }> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxBytes) {
    return { success: false, error: json({ error: 'Payload demasiado grande' }, { status: 413 }) };
  }

  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return {
      success: false,
      error: json({ error: 'No se pudo leer el cuerpo de la petición' }, { status: 400 })
    };
  }

  if (raw.length > maxBytes) {
    return { success: false, error: json({ error: 'Payload demasiado grande' }, { status: 413 }) };
  }

  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return { success: false, error: json({ error: 'JSON mal formado' }, { status: 400 }) };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      success: false,
      error: json({ error: first?.message ?? 'Payload inválido' }, { status: 400 })
    };
  }

  return { success: true, data: result.data };
}
