import { createClient, Client } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';

let client: Client | null = null;

function ensureLocalDir(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getDb(): Client {
  if (client) return client;
  const isProd = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  if (isProd) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL as string,
      authToken: process.env.TURSO_AUTH_TOKEN as string,
    });
    return client;
  }
  // Local SQLite
  const filePath = path.join(process.cwd(), '.data', 'db.sqlite');
  ensureLocalDir(filePath);
  const url = `file:${filePath}`;
  client = createClient({ url });
  return client;
}

export async function initDb() {
  const db = getDb();
  await db.execute(`PRAGMA journal_mode=WAL;`);
}
