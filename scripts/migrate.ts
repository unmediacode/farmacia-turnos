import { getDb, initDb } from '../src/lib/db.js';
import fs from 'node:fs';
import path from 'node:path';

async function main(): Promise<void> {
  const dataDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  await initDb();
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
  `);

  console.info('Migration completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
