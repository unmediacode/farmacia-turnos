import { getDb, initDb } from '../src/lib/db.js';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  // Ensure .data folder exists when using local SQLite
  const dataDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  await initDb();
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

  console.log('Migration completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
