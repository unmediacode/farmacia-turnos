export function json<T>(body: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function jsonError(message: string, status = 400, init: ResponseInit = {}): Response {
  return json({ error: message }, { ...init, status });
}
