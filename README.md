# Calendario Farmacia (Astro + Tailwind + SQLite)

Aplicación para gestionar recogidas de medicación de lunes a viernes, con un máximo de 10 clientes por día. Incluye vistas mensual y semanal, CRUD, contador por día, exportación a PDF (imprimir) y backend simple con Astro serverless. Base de datos local en SQLite (libSQL) con opción a Turso en producción. Autenticación opcional con Supabase (JWT).

## Tecnologías
- Astro 4 (adapter Vercel serverless)
- TailwindCSS
- libSQL (@libsql/client) con SQLite local o Turso
- TypeScript
- Supabase Auth opcional (verificación JWT con `jose`)

## Requisitos previos
- Node.js >= 18.17 o Bun >= 1.1

## Configuración
1) Copia el `.env.example` a `.env` y ajusta valores:

```
cp .env.example .env
```

Variables importantes:
- `REQUIRE_AUTH=false` por defecto. Si lo pones en `true`, las rutas de escritura (POST/PUT/DELETE) requieren un JWT válido de Supabase.
- Para Turso añade `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.
- Para auth añade `SUPABASE_JWKS_URL` (recomendado) o `SUPABASE_JWT_SECRET`.

2) Instala dependencias:
- Con npm:
```
npm install
```
- Con Bun:
```
bun install
```

3) Ejecuta la migración (crea la base de datos local en `.data/db.sqlite`):
- Con npm:
```
npm run migrate
```
- Con Bun:
```
bun run scripts/migrate.ts
```

4) Arranca el entorno de desarrollo:
- Con npm:
```
npm run dev
```
- Con Bun:
```
bun run dev
```

La app estará en `http://localhost:4321`.

## Uso
- Vista Mensual: `/` muestra un grid por meses con contador `n/10` por día (fines de semana atenuados).
- Vista Semanal: `/semana` muestra L–V con lista de clientes por día.
- CRUD: en la vista semanal usa los botones Añadir/Editar/Borrar. Límite de 10 por día. Fines de semana bloqueados.
- Exportar a PDF: usa el botón "Exportar a PDF" (invoca `window.print()`).

## API
- `GET /api/appointments?day=YYYY-MM-DD` -> listado del día
- `GET /api/appointments?week=YYYY-MM-DD` -> conteos L–V de la semana de esa fecha
- `GET /api/appointments?month=YYYY-MM` -> conteos del mes
- `POST /api/appointments` -> crear { date, name, phone?, notes? }
- `PUT /api/appointments/:id` -> actualizar { name?, phone?, notes? }
- `DELETE /api/appointments/:id` -> borrar cita

Si `REQUIRE_AUTH=true`, `POST/PUT/DELETE` requieren `Authorization: Bearer <token>` con JWT válido de Supabase.

## Despliegue en Vercel
- Incluye `astro.config.mjs` con adapter de Vercel y `vercel.json`.
- Configura variables de entorno en el proyecto de Vercel:
  - `REQUIRE_AUTH`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SUPABASE_JWKS_URL` (o `SUPABASE_JWT_SECRET`).
- Usa SQLite local en desarrollo. En Vercel, usa Turso (recomendado) para base de datos persistente.

## Estructura relevante
- `src/pages/index.astro`: vista mensual.
- `src/pages/semana.astro`: vista semanal y lógica UI CRUD ligera.
- `src/pages/api/appointments/*`: API REST.
- `src/lib/db.ts`: cliente libSQL (SQLite/Turso).
- `src/lib/utils/date.ts`: utilidades de fechas `dayjs` (grids y cálculos).
- `src/lib/auth.ts`: verificación JWT (Supabase) opcional.
- `scripts/migrate.ts`: migraciones (crea tablas/índices y carpeta `.data/`).

## Notas de mantenimiento
- Límite de 10 por día se valida en el backend al crear.
- Días de fin de semana se muestran, pero se evita crear nuevas entradas por backend (HTTP 400).
- Código preparado para escalar a un modal/diálogo de edición más avanzado o SSR de acciones.
