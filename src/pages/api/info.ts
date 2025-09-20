import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) ?? null,
    node: process.version,
    env: {
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      hasToken: !!process.env.TURSO_AUTH_TOKEN,
      requireAuth: String(process.env.REQUIRE_AUTH ?? 'false'),
    },
  }), { headers: { 'content-type':'application/json' }});
};
