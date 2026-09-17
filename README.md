# Disagro — Plataforma de Confirmación de Asistencia

Evento anual de promociones. Plataforma para que clientes confirmen asistencia y seleccionen
Servicios y/o Productos de interés, con descuentos calculados automáticamente según reglas de
negocio.

**Stack**: NestJS + CQRS + TypeORM + PostgreSQL (backend) · Next.js (App Router) + React Query +
Material-UI + React Hook Form/Zod (frontend) · Docker + Railway (deploy)

## 🚀 Demo en vivo

- **Frontend**: https://frontend-production-1d9f.up.railway.app
- **API**: https://api-production-138e.up.railway.app/api
- **Swagger**: https://api-production-138e.up.railway.app/api/docs

Desplegado en [Railway](https://railway.com) (3 servicios: Postgres, `api`, `frontend`, cada uno
desde su Dockerfile). Detalle en la sección [Despliegue en Railway](#despliegue-en-railway).

## Arquitectura

```
Cliente (navegador)
   │
   │ 1. POST /api/session/start           → JWT anónimo, sin login
   │ 2. GET  /api/items?search=&type=...  → buscar servicios/productos
   │ 3. POST /api/registrations           → confirmar asistencia (Bearer JWT)
   ▼
Frontend (Next.js)  ──HTTP──►  Backend (NestJS, CQRS)  ──TypeORM──►  PostgreSQL
```

Backend organizado por módulo CQRS autónomo (`items`, `session`, `registrations`), cada uno con
sus propios commands/queries/handlers/entities. Diagramas completos (arquitectura general, CQRS
por módulo, modelo entidad-relación, secuencia de confirmación y topología de deploy) en
[`documentation/diagramas-mermaid.md`](documentation/diagramas-mermaid.md) — Mermaid, se
renderiza directo en GitHub.

## Reglas de negocio

**Descuentos** (independientes entre sí, no se suman):
- Servicios: ≥2 → 3%; ≥2 **y** suma > Q.1,500 → 5% (reemplaza el 3%)
- Productos: ≥3 → 3%; ≥5 → 5% (reemplaza el 3%)

**Validaciones** al confirmar asistencia:
- Email único (409 Conflict si duplica)
- Fecha/hora del evento futura (400 Bad Request si pasada)
- Mínimo 1 ítem seleccionado, todos deben existir y estar activos (404 Not Found si falta)

Lógica de descuento aislada en `DiscountCalculatorService` (backend, sin dependencias de NestJS,
fácil de testear) con un espejo en `frontend/src/lib/discount.ts` para previsualización en vivo —
el valor que se persiste siempre lo calcula el backend al confirmar. Detalle completo de reglas y
convenciones en [`.claude/skills/disagro-rules/SKILL.md`](.claude/skills/disagro-rules/SKILL.md).

## Estructura

```
disagro/
├── backend/          # NestJS API (CQRS + TypeORM) — completo
├── frontend/         # Next.js + React Query + Material-UI — completo
├── documentation/    # Diagramas de arquitectura (Mermaid)
└── docker-compose.yml
```

## Instalación y desarrollo

**Con Docker (recomendado, levanta los 3 servicios):**
```bash
# Desde la raíz del proyecto
docker compose up --build
# PostgreSQL: localhost:5432 · API: http://localhost:3000/api · Frontend: http://localhost:3001
cd backend && npm run db:seed   # una vez, para cargar los ítems de ejemplo
```

**Sin Docker** (requiere PostgreSQL local en `localhost:5432`):
```bash
# Backend
cd backend
npm install
npm run start:dev
npm run db:seed   # opcional: carga los ítems de ejemplo (idempotente por ítem)

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev   # http://localhost:3001
```

Swagger disponible en: `http://localhost:3000/api/docs`

## Testing

```bash
# Backend
cd backend
npm test          # unitarios (DiscountCalculatorService) — 20 tests
npm run test:e2e  # flujo completo vía SQLite en memoria — 19 tests

# Frontend
cd frontend
npm test          # paridad del preview de descuento con el backend — 11 tests
npm run build     # incluye type-check completo
npm run lint
```

## Despliegue en Railway

Los 3 servicios (Postgres, `api`, `frontend`) corren en un solo proyecto de Railway, cada app
service desde su Dockerfile existente (sin cambios de código para el build en sí). No hay
CI/CD todavía — el redeploy es manual vía `railway up`. **URLs actuales**: ver sección
"Demo en vivo" más arriba.

<details>
<summary><strong>Cómo se configuró (para reproducirlo o redesplegar)</strong></summary>

```bash
railway login                              # o railway up, que autentica sobre la marcha
railway init --name disagro

railway add --database postgres --json
railway add --service api --json
railway add --service frontend --json

# Builder Dockerfile explícito en ambos app services (evita que Railpack
# intente autodetectar en vez de usar el Dockerfile ya existente)
railway environment edit --service-config api build.builder DOCKERFILE
railway environment edit --service-config frontend build.builder DOCKERFILE

# Backend: variables referenciando el servicio Postgres por nombre
railway variable set \
  DB_HOST='${{Postgres.PGHOST}}' DB_PORT='${{Postgres.PGPORT}}' \
  DB_USERNAME='${{Postgres.PGUSER}}' DB_PASSWORD='${{Postgres.PGPASSWORD}}' \
  DB_NAME='${{Postgres.PGDATABASE}}' JWT_EXPIRATION=180 NODE_ENV=production \
  DB_SYNCHRONIZE=true PORT=3000 --service api

railway variable set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" --service api

# Dominios públicos (uno por servicio) — anotar las URLs generadas
railway domain --service api --json
railway domain --service frontend --json
railway domain update <api-domain> --port 3000 --service api
railway domain update <frontend-domain> --port 3000 --service frontend

# Wiring cruzado: CORS del backend y build-time URL del frontend
railway variable set FRONTEND_URL='<frontend-domain-con-https>' --service api
railway variable set NEXT_PUBLIC_API_URL='<api-domain-con-https>/api' --service frontend

# Deploy (upload directo del subdirectorio, sin depender de GitHub)
railway up ./backend --path-as-root --service api --detach --json -m "deploy"
railway up ./frontend --path-as-root --service frontend --detach --json -m "deploy"

# Sembrar datos (una vez): la DB solo es alcanzable por red privada de Railway,
# así que se abre un TCP proxy temporal, se corre el seed local, y se borra el proxy.
railway tcp-proxy create --service Postgres --port 5432 --json
DB_HOST=<proxy-domain> DB_PORT=<proxy-port> DB_USERNAME=postgres \
  DB_PASSWORD=<PGPASSWORD> DB_NAME=railway npm --prefix backend run db:seed
railway tcp-proxy delete <proxy-domain>:<proxy-port> --service Postgres --yes
```

</details>

<details>
<summary><strong>Decisiones y gotchas específicos de este despliegue</strong></summary>

- **`DB_SYNCHRONIZE`**: el proyecto no tiene migraciones de TypeORM todavía (`synchronize`
  dependía de `NODE_ENV === 'development'`, así que en producción nunca se habrían creado las
  tablas). Se agregó `DB_SYNCHRONIZE` como flag explícito e independiente de `NODE_ENV`
  (`backend/src/app.module.ts`) — `true` solo en este despliegue inicial. Para producción real a
  largo plazo, reemplazar por migraciones versionadas.
- **`PORT` debe fijarse explícitamente en cada servicio**: Railway asigna su propio `PORT` en
  runtime (por defecto 8080) que pisa el `ENV PORT=3000` del Dockerfile — si el dominio apunta a
  3000 pero el contenedor escucha en 8080, da 502. Se fijó `PORT=3000` como variable en ambos
  servicios para que coincida con el puerto configurado en `railway domain update --port 3000`.
- **`NEXT_PUBLIC_API_URL` es build-time, no runtime**: Railway inyecta las variables del servicio
  como build args para builds con Dockerfile, así que basta con `variable set` antes del deploy
  (no requiere config adicional) — pero si se cambia la URL después, hay que re-desplegar
  (redeploy no alcanza, hay que reconstruir la imagen).
- **La base de datos solo es alcanzable por red privada** (`postgres.railway.internal`) desde
  dentro de Railway — no desde la máquina local ni siquiera vía `railway run`. Para sembrar datos
  una sola vez desde fuera, se usa un TCP proxy temporal (`railway tcp-proxy create`), y se borra
  inmediatamente después para no dejar la base expuesta públicamente.
- **`ssl`**: se agregó soporte opcional (`DB_SSL=true`) en `app.module.ts` por si la imagen
  `postgres-ssl` de Railway lo exige — en la práctica no fue necesario sobre la red privada.
- **El builder de un servicio puede revertir a Railpack** (autodetección) en vez de quedarse en
  `DOCKERFILE` — si un deploy falla con un builder inesperado, reconfirmar con
  `railway environment edit --service-config <servicio> build.builder DOCKERFILE` antes de
  reintentar.

</details>

## Decisiones de arquitectura

- **CQRS**: Separación de Commands (escritura) y Queries (lectura) para escalabilidad.
- **TypeORM**: ORM con PostgreSQL (dev: auto-sync, prod: migrations manual — pendiente real).
- **JWT anónimo**: Sesión de corta duración sin login de cliente (protege contra spam/CSRF).
- **Modular**: Cada módulo de dominio auto-contenido (commands/queries/events/entities).
- **Next.js App Router + React Query + MUI**: sin librería de date-picker adicional
  (`datetime-local` nativo), sin workspaces compartidos entre frontend/backend (tipos
  calcados manualmente en `frontend/src/types/api.ts`).