# Disagro — Documentación para Claude Code

## Descripción del proyecto

Plataforma de confirmación de asistencia para evento anual de promociones de Disagro.
Clientes confirman asistencia y seleccionan Servicios y/o Productos de interés.
El sistema calcula automáticamente descuentos según reglas de negocio.

**Stack**: NestJS + CQRS + TypeORM + PostgreSQL (backend) | Next.js (App Router) + React Query + Material-UI + React Hook Form/Zod (frontend)

## Estado actual

✅ **Backend (NestJS)**: Completo, auditado y verificado (Pasos 1-8)
✅ **Frontend (Next.js)**: Completo y verificado end-to-end con navegador real (Playwright), dev y dockerizado

## Estructura del proyecto

```
disagro/
├── .claude/
│   └── skills/disagro-rules/SKILL.md          # Reglas de negocio y convenciones
├── backend/
│   ├── src/
│   │   ├── items/                             # Módulo CQRS: servicios y productos
│   │   ├── registrations/                     # Módulo CQRS: confirmaciones de asistencia
│   │   ├── session/                           # Módulo: JWT anónimo de sesión
│   │   ├── common/                            # Servicios, filters, interceptors, transformers
│   │   ├── database/                          # Seeds (+ runner), config
│   │   └── main.ts, app.module.ts
│   ├── test/registration-flow.e2e-spec.ts     # e2e (SQLite en memoria)
│   ├── Dockerfile (multi-stage)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                               # fetch client tipado (session, items, registrations)
│   │   ├── hooks/                             # useSession, useItems, useCreateRegistration
│   │   ├── lib/                                # discount.ts (espejo del backend), zod schema
│   │   ├── components/                        # RegistrationForm y sub-componentes
│   │   ├── types/api.ts                       # tipos calcados de los DTOs del backend
│   │   └── theme.ts, app-providers.tsx
│   ├── src/app/                                # App Router (layout.tsx, page.tsx)
│   ├── Dockerfile (multi-stage, output standalone)
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml                         # PostgreSQL + API + Frontend
├── README.md                                  # Estado del proyecto
└── CLAUDE.md                                  # Este archivo

## Decisiones de arquitectura (confirmadas)

- **CQRS**: Separación Commands (escritura) y Queries (lectura) en cada módulo
- **TypeORM**: ORM con PostgreSQL, entidades + migrations (sync en dev)
- **JWT anónimo**: Sesión sin login de usuario (30 min de duración)
- **Modular**: Cada módulo = commands/queries/events/entities/dto autónomo
- **Monorepo simple**: backend/ y frontend/ con package.json separados (sin workspaces)

## Reglas de negocio (críticas)

Ver `.claude/skills/disagro-rules/SKILL.md` para detalles completos.

**Descuentos (independientes)**:
- Servicios: ≥2 → 3%, ≥2 AND suma > Q.1,500 → 5% (reemplaza 3%)
- Productos: ≥3 → 3%, ≥5 → 5% (reemplaza 3%)

**Validaciones**:
- Email único (409 Conflict si duplica)
- Fecha/hora del evento futura (400 Bad Request si pasada)
- Mínimo 1 ítem seleccionado
- Items deben existir en DB (404 Not Found si falta)

## API Endpoints (Backend)

**Items (búsqueda)**
- `GET /api/items?search=texto&type=SERVICE|PRODUCT&minPrice=&maxPrice=&sortBy=price_asc|price_desc`
  → lista filtrada. Todos los parámetros son opcionales y combinables; `type` ausente = ambos
  tipos, `sortBy` ausente = orden por nombre ascendente. UI: botón de filtros junto al buscador
  (`frontend/src/components/ItemsFilterMenu.tsx`).

**Session**
- `POST /api/session/start` → `{ token, expiresIn }` (anónimo, sin auth)

**Registrations** (protegido por `Authorization: Bearer <token>`)
- `POST /api/registrations` → crea confirmación, calcula descuentos (201)
- `GET /api/registrations/:id` → obtiene detalles con descuentos (200)

**Swagger**: `http://localhost:3000/api/docs`

## Cómo ejecutar

### Con Docker (recomendado, los 3 servicios)
```bash
docker compose up --build
cd backend && npm run db:seed   # una vez
```
- PostgreSQL en `localhost:5432` (usuario: disagro_user / pass: disagro_pass)
- API en `http://localhost:3000/api`
- Frontend en `http://localhost:3001`

### Sin Docker (dev local)
```bash
# Backend
cd backend && npm install && npm run start:dev && npm run db:seed

# Frontend (otra terminal)
cd frontend && npm install && npm run dev
```
Requiere PostgreSQL local corriendo en `localhost:5432`. El frontend lee
`NEXT_PUBLIC_API_URL` de `frontend/.env.local` (default `http://localhost:3000/api`).

## Testing

```bash
cd backend
npm run test                # Unit tests (DiscountCalculatorService) — 20 tests
npm run test:cov            # Coverage report
npm run test:e2e            # E2E flujo completo (SQLite en memoria) — 19 tests
npm run test:debug          # Debug con node --inspect-brk
```

El e2e no requiere Docker/Postgres: usa `better-sqlite3` en memoria vía `Test.createTestingModule`.
No cubre la búsqueda por texto de `GET /items` (usa `ILIKE`, específico de Postgres).

**Frontend:**
```bash
cd frontend
npm test          # paridad discount.ts vs backend — 11 tests (Jest + next/jest)
npm run build     # incluye type-check completo (tsc vía next build)
npm run lint      # eslint flat config (Next 16 ya no tiene `next lint`)
```

## Scripts útiles

```bash
# Lint y format
npm run lint
npm run format

# Build para producción
npm run build
npm run start:prod

# Debug
npm run start:debug
```

## Bases de datos

**PostgreSQL** (dev: auto-sync, prod: migrations manual)

Tablas:
- `items`: servicios y productos (`type` como `simple-enum`, portable entre motores)
- `registrations`: confirmaciones de asistencia (`email` con constraint único)
- `registration_items`: ítems seleccionados + precio snapshot

Seed: `npm run db:seed` inserta los ítems de ejemplo de `items.seed.ts` (15 actualmente: 7
servicios, 8 productos) que aún no existan en la tabla, comparando por `name` — idempotente por
ítem, así que agregar nuevos ítems al seed y volver a correrlo en una base ya sembrada es seguro.
Migraciones: `src/database/migrations/` (aún no hay ninguna; se usa `synchronize` en dev).

## Skills de Claude Code

- **disagro-rules**: Reglas de descuento y convenciones CQRS (úsalo siempre)
- **nestjs-expert**: Para módulos, controllers, services, guards
- **api-designer**: Para endpoints, DTOs, validación
- **secure-code-guardian**: Para JWT, validación, OWASP
- **typescript-pro**: Para tipos avanzados, generics
- **devops-engineer**: Para Docker, CI/CD
- **code-documenter**: Para Swagger, JSDoc

## Despliegue — Railway (✅ completo)

3 servicios en un proyecto Railway (`disagro`, workspace `edaral3`): `Postgres`, `api`, `frontend`,
cada app service construido desde su Dockerfile existente (`build.builder DOCKERFILE`), sin
cambios de código para el build. URLs y comando de reproducción completos en `README.md` sección
"Despliegue en Railway" — no los dupliques aquí, mantenlos en un solo lugar.

**Pendiente real que queda** (no bloqueante para la demo):
- Migraciones de TypeORM reales (hoy usa `DB_SYNCHRONIZE=true` en producción a falta de ellas)
- CI/CD (GitHub Actions o similar) para redeploys automáticos — hoy es manual vía `railway up`
- Backups automáticos de Postgres (Railway los ofrece como upgrade, no configurado)

## Gotchas de Docker (ya resueltos, no repetir el diagnóstico)

- **`better-sqlite3` rompe el build de producción del backend**: es una devDependency
  (solo para el e2e), pero TypeORM la lista como `optionalDependency` de todos sus drivers,
  así que el lockfile la marca `devOptional` en vez de `dev` — `npm ci --omit=dev` sola NO
  la excluye. Runtime stage: `npm ci --omit=dev --omit=optional`. Builder stage: como sí
  necesita las devDependencies reales (typescript, nest/cli) no se puede usar `--omit=dev`
  ahí, así que se instala el toolchain nativo (`apk add python3 make g++`) para poder
  compilarla sin problema — se descarta con la etapa, no infla la imagen final.
- **`--only=production` está deprecado y puede no filtrar correctamente** en npm 10+; usar
  `--omit=dev` en su lugar.
- **`NEXT_PUBLIC_*` se embebe en build time**, no runtime — en `docker-compose.yml` va como
  `build.args`, no `environment:`, y debe apuntar a la URL que ve el **navegador** (el puerto
  publicado en el host), no al nombre del servicio en la red interna de Docker.
- **MUI v9 breaking changes** (frontend usa `@mui/material@9.x`, más nueva que lo típico):
  `Grid` requiere `size={{xs:..}}` en vez de `item xs={}`; `Stack`/`Typography` ya no aceptan
  `alignItems`/`display` como props directas, deben ir en `sx`.
- **Next.js 16**: Turbopack es el default (no usar `--turbopack` en los scripts), `next lint`
  fue removido (usar `eslint` directo, ya configurado así), y el proyecto trae su propio
  `node_modules/next/dist/docs/` con la documentación versionada — consultarla ahí primero
  ante cualquier duda de API antes de asumir comportamiento de versiones anteriores.
- **Hidratación de React**: cuidado al pasar un `<Chip>` (MUI, renderiza `<div>`) como
  `secondary` de `ListItemText` (por defecto renderiza `<p>`) — HTML inválido. Se resolvió
  con `slotProps={{ secondary: { component: 'span' } }}` en `ItemsPicker.tsx`.
- **`JWT_EXPIRATION` nunca funcionó de verdad hasta 2026-09-16**, por dos bugs independientes
  que se enmascaraban entre sí (ver `backend/src/app.module.ts` y `session.controller.ts`):
  1. El payload del JWT seteaba `iat: Date.now()` (milisegundos) en vez de dejar que
     `jsonwebtoken` lo autogenere en segundos — corrompía `exp` a una fecha ~58,000 años en
     el futuro.
  2. `ConfigService.get('JWT_EXPIRATION', ...)` devuelve **string** (viene de una env var).
     `jsonwebtoken` interpreta un `expiresIn` string vía la librería `ms`, que trata un
     numeral sin unidad (ej. `"180"`) como **milisegundos**, no segundos — colapsa a una
     duración de ~0. Fix: envolver siempre en `Number(...)`.
  Ambos bugs producían el mismo síntoma visible (`exp === iat` en el token decodificado), así
  que si vuelves a tocar la duración de la sesión, decodifica el JWT real (no confíes solo en
  el `expiresIn` de la respuesta) para confirmar que `exp - iat` es lo esperado. Hay 3 tests
  e2e de regresión para esto en `registration-flow.e2e-spec.ts` (describe "Sesión: expiración
  real del JWT").
- **`railway up ./backend --path-as-root ...` borró `backend/test/` del disco local** durante
  un deploy (causa exacta no confirmada — sospecha: interacción con `.dockerignore`, que
  lista `test`, aunque otras rutas ahí listadas no se vieron afectadas). Se recuperó con
  `git restore --source=HEAD -- backend/test/` y se reaplicaron los cambios pendientes.
  **Regla desde ahora: comitear (`git commit`, no hace falta push) antes de cada `railway up`**,
  para que cualquier recurrencia sea trivialmente recuperable con `git restore`.

## Auditoría 2026-09-15 (importante para futuras sesiones)

El bootstrap inicial se hizo sin instalar dependencias ni ejecutar el código ni una sola vez.
Una auditoría posterior corrió `npm install`, `tsc`, `npm run build`, unit tests y un e2e nuevo
por primera vez, y encontró varios bugs reales (la app ni siquiera arrancaba: `SessionGuard` no
era resolvible por DI porque `RegistrationsModule` no importaba `SessionModule`). Todos los
hallazgos y fixes están detallados en la sección "Auditoría" de `README.md` — léela antes de
asumir que algo "ya está probado" solo porque el código existe. Regla general: si vas a declarar
un paso completo, corre `npm install && npx tsc --noEmit && npm test && npm run test:e2e`
primero, no asumas que compila por inspección visual.

## Notas de desarrollo

- **Descuentos**: lógica pura en `DiscountCalculatorService` (sin deps de NestJS), fácil de testear
- **Eventos de dominio**: emitidos en Command Handlers (ej. `RegistrationConfirmedEvent`), listos para integraciones futuras
- **Filtros de excepciones**: `HttpExceptionFilter` normaliza errores globalmente
- **Interceptores**: `LoggingInterceptor` loguea requests/responses
- **Validación**: `ValidationPipe` con whitelist automático de DTOs

## Ambiente

- Node.js 20+
- npm (o pnpm/yarn)
- PostgreSQL 14+ (o 16 en Docker)
- Docker (recomendado para dev)

## Contacto / Autor

Prueba técnica de Disagro — Arnold Developer (arnolso201@gmail.com)

---

**Último update**: 2026-09-16
**Backend Status**: ✅ Completo y verificado (Pasos 1-8, auditado y corregido)
**Frontend Status**: ✅ Completo y verificado end-to-end (dev, dockerizado y en producción)
**Deploy Status**: ✅ Live en Railway — ver README.md sección "Demo en vivo" para las URLs
**Pendiente**: migraciones reales, CI/CD, backups automáticos (no bloqueantes)

Para más detalles de reglas, ver `.claude/skills/disagro-rules/SKILL.md`.
