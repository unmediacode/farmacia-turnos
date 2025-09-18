import { createClient, Client } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';

let client: Client | null = null;
let schemaEnsured = false;

function hasTursoCredentials() {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

function ensureLocalDir(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getDb(): Client {
  if (client) return client;
  const isProd = hasTursoCredentials();
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

export async function ensureSchema({ force = false }: { force?: boolean } = {}) {
  if (schemaEnsured && !force) return;

  const hasTurso = hasTursoCredentials();
  if (hasTurso && !force) {
    schemaEnsured = true;
    return;
  }

  if (!hasTurso) {
    await initDb();
  }

  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL, -- YYYY-MM-DD (lunes a viernes)
      name TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
  `);

  schemaEnsured = true;
}
