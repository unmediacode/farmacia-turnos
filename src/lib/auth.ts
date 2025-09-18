import { createRemoteJWKSet, jwtVerify } from 'jose';
import { json } from '@/lib/response';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export async function verifyJwt(token: string): Promise<boolean> {
  try {
    const jwksUrl = process.env['SUPABASE_JWKS_URL'];
    const secret = process.env['SUPABASE_JWT_SECRET'];

    if (jwksUrl) {
      if (!jwks) jwks = createRemoteJWKSet(new URL(jwksUrl));
      await jwtVerify(token, jwks);
      return true;
    }

    if (secret) {
      const enc = new TextEncoder().encode(secret);
      await jwtVerify(token, enc);
      return true;
    }
  } catch (error) {
    console.warn('JWT inválido', error);
    return false;
  }
  return false;
}

export async function requireAuth(request: Request): Promise<Response | null> {
  const requireAuthFlag = String(process.env['REQUIRE_AUTH'] ?? 'false') === 'true';
  if (!requireAuthFlag) return null;

  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return json({ error: 'Unauthorized' }, { status: 401, headers: { 'www-authenticate': 'Bearer' } });
  }

  const ok = await verifyJwt(token);
  if (!ok) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
