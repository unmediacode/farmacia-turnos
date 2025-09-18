import { createClient, type Client } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';

type DatabaseConfig =
  | { mode: 'remote'; url: string; token: string }
  | { mode: 'local' };

let client: Client | null = null;

function ensureLocalDir(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolveDatabaseConfig(): DatabaseConfig {
  const url = process.env['TURSO_DATABASE_URL'];
  const token = process.env['TURSO_AUTH_TOKEN'];

  if (url && token) {
    return { mode: 'remote', url, token };
  }

  if (url || token) {
    throw new Error('Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN o deja ambos vacíos.');
  }

  return { mode: 'local' };
}

export function getDb(): Client {
  if (client) return client;

  const config = resolveDatabaseConfig();

  if (config.mode === 'remote') {
    client = createClient({ url: config.url, authToken: config.token });
    return client;
  }

  const filePath = path.join(process.cwd(), '.data', 'db.sqlite');
  ensureLocalDir(filePath);
  const url = `file:${filePath}`;
  client = createClient({ url });
  return client;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  await db.execute('PRAGMA journal_mode=WAL;');
}
