import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

export const GET: APIRoute = async () => {
  try {
    // Crea tablas mínimas si no existen (ajusta a tu esquema real si hace falta)
    await db.execute(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      notas TEXT
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS turnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      UNIQUE(cliente_id, fecha),
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL
    )`);

    // Test de escritura (insert + delete)
    const r = await db.execute(
      "INSERT INTO appointments (name, date) VALUES ('PING', '2099-01-01')"
    );
    await db.execute("DELETE FROM appointments WHERE id = ?", [r.lastInsertRowid]);

    const tables = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    return new Response(JSON.stringify({
      ok: true,
      writeTest: true,
      tables: tables.rows.map((t: any) => t.name),
    }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
