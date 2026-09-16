# Disagro — Plataforma de Confirmación de Asistencia

Evento anual de promociones. Plataforma para que clientes confirmen asistencia y seleccionen Servicios y/o Productos de interés.

## 🚀 Demo en vivo

- **Frontend**: https://frontend-production-1d9f.up.railway.app
- **API**: https://api-production-138e.up.railway.app/api
- **Swagger**: https://api-production-138e.up.railway.app/api/docs

Desplegado en [Railway](https://railway.com) (3 servicios: Postgres, `api`, `frontend`, cada uno
desde su Dockerfile). Ver sección "Despliegue en Railway" más abajo para el detalle de cómo se
configuró y cómo reproducirlo.

## Estructura

```
disagro/
├── backend/          # NestJS API (CQRS + TypeORM) — completo
├── frontend/         # Next.js + React Query + Material-UI — completo
└── docker-compose.yml
```

## Backend — Estado actual

**Paso 1 (✅ COMPLETADO): Bootstrap del proyecto**
- Inicialización NestJS con CQRS, TypeORM, JWT, Swagger
- Configuración de `.env`, ESLint, Prettier
- Estructura de carpetas (commands/queries/events/entities por módulo)

**Paso 2 (✅ COMPLETADO): Módulo `items`**
- Entidad `Item` (id, name, description, price, type, category, active)
- Query CQRS: `GetItemsQuery` con filtro por búsqueda y tipo (SERVICE/PRODUCT)
- Controller: `GET /items?search=&type=`

**Paso 3 (✅ COMPLETADO): Servicio de dominio `DiscountCalculatorService`**
- Lógica pura de cálculo de descuentos (sin dependencias de NestJS/TypeORM)
- Reglas exactas: servicios (≥2 → 3%, ≥2 y suma>1500 → 5%), productos (≥3 → 3%, ≥5 → 5%)
- Tests exhaustivos cubriendo límites (2, 3, 4, 5 ítems; suma=1500 vs 1500.01; decimales)
- Interfaz `SelectedItem`, `DiscountResult`

**Paso 4 (✅ COMPLETADO): Módulo `registrations` con CQRS**
- Entidades `Registration` y `RegistrationItem` (snapshot de precios)
- Command: `CreateRegistrationCommand` con validaciones (email único, fecha futura, items existen)
- Query: `GetRegistrationByIdQuery` para obtener detalles
- Controller: `POST /registrations` (protegido por JWT sesión), `GET /registrations/:id`
- Calcula automáticamente descuentos al confirmar
- Emite evento de dominio `RegistrationConfirmedEvent`
- DTOs con validación (class-validator)

**Paso 5 (✅ COMPLETADO): Módulo `session` con JWT anónimo**
- Controller: `POST /session/start` → emite JWT de corta duración (configurable vía JWT_EXPIRATION; actualmente 3 min) sin login
- Guard: `SessionGuard` valida token en Authorization header
- Protege `POST /registrations` contra spam/CSRF
- Payload anónimo: solo `sub: 'anonymous-form'`

**Paso 6 (✅ COMPLETADO): Cross-cutting concerns**
- `HttpExceptionFilter` global: normaliza todas las respuestas de error (formato consistente)
- `LoggingInterceptor` global: loguea requests/responses con duración
- `ValidationPipe` global: whitelist, forbid unknown fields, auto-transform DTO

**Paso 7 (✅ COMPLETADO): Tests e2e del flujo completo**
- 19 tests e2e (SQLite en memoria, sin depender de Docker): sesión → items → registro → consulta
- Cubre ambos escenarios de descuento, duplicados de email (incl. case-insensitive), fecha pasada,
  ítem inactivo, ítem inexistente, ítems duplicados en la misma request, UUIDs inválidos, rango de
  precio y orden por precio en `GET /items`

**Paso 8 (✅ COMPLETADO): Dockerización**
- `Dockerfile` multi-stage: build + runtime optimizado
- `docker-compose.yml`: PostgreSQL 16 + NestJS API con health checks
- `.dockerignore`: excluye node_modules, .git, dist (para build)
- Variables de entorno: DB_HOST, JWT_SECRET, NODE_ENV, etc.
- Volumen persistente para datos Postgres

## Auditoría (2026-09-15)

El bootstrap inicial (Pasos 1-8) se hizo con un modelo más ligero y **nunca se instalaron
las dependencias ni se ejecutó el código** — el proyecto compilaba solo "en teoría". Se hizo
una auditoría completa instalando, compilando y corriendo todo por primera vez, lo que reveló
varios problemas reales que ya están corregidos:

- **La app no arrancaba**: `SessionGuard` (usado vía `@UseGuards` en `RegistrationsController`)
  nunca era resolvible porque `RegistrationsModule` no importaba `SessionModule` — NestJS
  lanzaba `UnknownDependenciesException` al bootstrap. Confirmado con un repro aislado antes
  y después del fix.
- **`npm install` fallaba**: varias versiones de `@nestjs/*` en `package.json` eran incompatibles
  entre sí (ej. `@nestjs/swagger@7.x` con Nest 11) o no existían (`@nestjs/jwt@12.1.0`).
- **Dependencias ESM incompatibles**: las versiones más nuevas de `@nestjs/typeorm` (12.x) y
  `@nestjs/jwt` (12.x) se distribuyen como ESM puro, incompatibles con el resto del proyecto
  (CommonJS) — fallaban en tiempo de ejecución, no solo al compilar. Se fijaron a las últimas
  versiones 11.x compatibles con Nest 11 en CommonJS.
- **`tsconfig.json` sin `experimentalDecorators`/`emitDecoratorMetadata`**: sin esto, ningún
  decorador de NestJS/TypeORM/class-validator compila.
- **Condición de carrera en email duplicado**: el check "ya existe" y el `INSERT` no estaban en
  una transacción ni había constraint único en DB — dos requests concurrentes con el mismo email
  podían pasar ambos. Se agregó `unique: true` en la columna y se envolvió todo en una transacción
  con manejo del error de constraint único como red de seguridad adicional.
- **Ítems inactivos aceptados en confirmaciones**: `CreateRegistrationHandler` no filtraba
  `active: true` al buscar los ítems seleccionados (inconsistente con `GetItemsHandler`).
- **Sin runner para el seed**: existían los datos de ejemplo pero ningún script los insertaba
  en la base de datos. Se agregó `npm run db:seed` (idempotente).
- **Dependencias muertas**: `passport`/`passport-jwt`/`@nestjs/passport` estaban declaradas pero
  nunca se usaban (el guard valida el JWT directamente); `ormconfig.ts` era código huérfano.
- **Boilerplate sin usar**: `AppController`/`AppService`/`app.controller.spec.ts` (el "Hello World"
  por defecto de Nest) nunca estaban registrados en `AppModule` — eliminados.
- **DTO confuso**: `selectedItemIds` pedía objetos `{id}` en vez de strings — se simplificó a
  `string[]` con validación de UUID y de duplicados (`@ArrayUnique`).
- **Tipos Postgres-only** (`enum`, `timestamp`) reemplazados por alternativas portables
  (`simple-enum`, tipo inferido) para no acoplar el esquema a un solo motor de base de datos.

Todo lo anterior está verificado empíricamente: `npm install`, `npx tsc --noEmit`, `npm run build`,
`npm test` (20/20) y `npm run test:e2e` (19/19) pasan limpio.

## Frontend — Estado actual

✅ **Completo**: Next.js (App Router) + React Query + Material-UI + React Hook Form/Zod.

- Formulario de 2 columnas (info personal + buscador/checklist de servicios y productos),
  acorde al mockup del enunciado.
- Sesión anónima (`useSession`): pide un JWT al backend y lo persiste en `sessionStorage`;
  reintenta automáticamente si expira en medio del llenado (401 → nueva sesión → reintento).
- Búsqueda de ítems con debounce (300ms) vía React Query.
- **Filtros avanzados** (`ItemsFilterMenu.tsx`, botón junto al buscador): tipo (todos/servicios/
  productos), rango de precio mínimo/máximo, y orden por precio (menor→mayor / mayor→menor).
  Se aplican en vivo, igual que la búsqueda de texto. Backend: `GET /items` acepta `minPrice`,
  `maxPrice` y `sortBy` además de `search`/`type` (retrocompatible, todos opcionales).
- **Descuento en vivo**: `src/lib/discount.ts` es un espejo puro de
  `DiscountCalculatorService` del backend (mismos tests de paridad), usado solo para
  previsualización mientras el cliente selecciona ítems — el descuento que se persiste
  siempre lo calcula el backend al confirmar.
- Confirmación inline en la misma página (sin ruta nueva), mostrando el descuento real
  devuelto por el backend, no el preview del cliente.
- CORS habilitado en el backend (`FRONTEND_URL` env var) para permitir las llamadas del navegador.

**Verificado end-to-end con un navegador real** (Playwright headless, no solo build/tests):
sesión anónima, búsqueda, ambos escenarios de descuento (servicios ≥2 con suma>1500 → 5%;
productos ≥5 → 5%), confirmación exitosa con datos reales del backend, y el error 409 (email
duplicado) mostrándose correctamente en la UI — primero corriendo backend+frontend en modo
dev contra Postgres real, y de nuevo contra el stack 100% dockerizado (`docker-compose up`).
En el camino se encontró y corrigió un error de hidratación de React (un `<Chip>` de MUI,
que renderiza `<div>`, anidado dentro del `<p>` por defecto de `ListItemText`'s secondary).

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

**Tests:**
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
service desde su Dockerfile existente (sin cambios de código para el build en sí).

**URLs actuales**: ver sección "Demo en vivo" arriba.

### Cómo se configuró (para reproducirlo o redesplegar)

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

### Decisiones y gotchas específicos de este despliegue

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

## Decisiones de arquitectura

- **CQRS**: Separación de Commands (escritura) y Queries (lectura) para escalabilidad.
- **TypeORM**: ORM con PostgreSQL (dev) o Postgres (prod).
- **JWT**: Sesión anónima de corta duración (no login de cliente).
- **Modular**: Cada módulo de dominio auto-contenido (commands/queries/events/entities).
- **Next.js App Router + React Query + MUI**: sin librería de date-picker adicional
  (`datetime-local` nativo), sin workspaces compartidos entre frontend/backend (tipos
  calcados manualmente en `frontend/src/types/api.ts`).

Ver `.claude/skills/disagro-rules/SKILL.md` para reglas de descuento y convenciones exactas.
