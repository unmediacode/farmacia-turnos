# Calendario Farmacia

Aplicación Astro para gestionar recogidas de medicación de lunes a viernes con un máximo de 10 turnos por día. Incluye vistas mensual y semanal, CRUD seguro, exportación a PDF (impresión) y API serverless lista para Vercel.

## Requisitos
- Node.js 20.11 o superior (`.nvmrc` incluido)
- npm 10 (instalado con Node 20) o Bun 1.1+
- SQLite local (se crea automáticamente en `.data/db.sqlite`)

## Puesta en marcha
1. Instala dependencias
   ```bash
   npm install
   ```
2. Crea el fichero de entorno
   ```bash
   cp .env.example .env
   ```
3. Lanza la migración (crea la base SQLite local)
   ```bash
   npm run migrate
   ```
4. Arranca el entorno de desarrollo en `http://localhost:4321`
   ```bash
   npm run dev
   ```

## Scripts disponibles
- `npm run dev` – servidor de desarrollo Astro
- `npm run build` – build de producción
- `npm run preview` – previsualización local del build
- `npm run lint` – ESLint con reglas para Astro + TypeScript
- `npm run typecheck` – `tsc --noEmit` con opciones estrictas
- `npm run test` – tests de utilidades con Vitest
- `npm run format` – Prettier sobre todo el repo
- `npm run migrate` – inicializa/actualiza la base local (`.data/db.sqlite`)

## Variables de entorno
La aplicación funciona sin autenticación en local. Ajusta según tus necesidades:

| Variable | Descripción |
| --- | --- |
| `REQUIRE_AUTH` | `false` por defecto. Si es `true`, las rutas de escritura exigen un JWT de Supabase. |
| `TURSO_DATABASE_URL` | URL `libsql://` de Turso para despliegues persistentes. |
| `TURSO_AUTH_TOKEN` | Token de acceso Turso, obligatorio junto con la URL. |
| `SUPABASE_JWKS_URL` | JWKS de Supabase para validar JWT (recomendado). |
| `SUPABASE_JWT_SECRET` | Alternativa simétrica si no usas JWKS. |

> Si defines credenciales de Turso, se usará automáticamente en producción. Si sólo rellenas uno de los dos campos, el arranque fallará para evitar configuraciones parciales.

## Seguridad y validaciones
- Validación con Zod de todos los payloads y parámetros de la API.
- Límite configurable en código de 10 citas por día y restricción L-V en backend + frontend.
- Rate limiting in-memory (30 req/min por IP) aplicado a POST/PUT/DELETE.
- Sanitización básica (`trim`, tamaños max.) para evitar inyecciones y XSS.
- `vercel.json` incluye CSP restrictivo, HSTS, Referrer-Policy, Permissions-Policy y cacheo de `/_astro`.

## Despliegue en Vercel
1. Usa el adaptador serverless (`@astrojs/vercel/serverless`) incluido en `astro.config.mjs`. Mantiene compatibilidad con SQLite/libSQL.
2. Variables recomendadas en el panel de Vercel:
   - `REQUIRE_AUTH`
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `SUPABASE_JWKS_URL` o `SUPABASE_JWT_SECRET`
3. Node 20 se configura mediante `vercel.json` y `.nvmrc`.
4. El build se realiza con `npm run build`; el `outputDirectory` es `dist`.
5. Asegura que la región del proyecto sea europea (`fra1`) para menor latencia.

## Pruebas
Los utilitarios de calendario cuentan con tests (`src/lib/utils/date.test.ts`). Ejecuta:
```bash
npm run test
```

## Arquitectura rápida
- `src/pages` – rutas Astro (`/` mensual, `/semana` semanal, API REST).
- `src/lib` – base de datos, auth, validaciones, utilidades de fechas, rate-limit y helpers HTTP.
- `src/components` – vistas de calendario accesibles, listas para teclado/lector.
- `src/scripts/week-modal.ts` – lógica cliente modular para el modal CRUD (sin inline scripts, compatible con CSP).

## Deploy checklist
- [ ] Variables `.env` configuradas y credenciales seguras en Vercel
- [ ] `npm run lint && npm run typecheck && npm run test`
- [ ] `npm run build`
- [ ] Turso configurado si necesitas persistencia en producción
- [ ] Revisión de logs post despliegue (errores HTTP ≥400)

> La API responde siempre en JSON y establece `cache-control: no-store` para evitar servir datos obsoletos.
