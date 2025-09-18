import { ensureSchema } from '../src/lib/db.js';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const usingTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

  if (!usingTurso) {
    // Ensure .data folder exists when using local SQLite
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  await ensureSchema({ force: true });

  console.log('Migration completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
