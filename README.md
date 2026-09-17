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
npm test       
npm run test:e2e 

# Frontend
cd frontend
npm test          
npm run build    
npm run lint
```

## Despliegue en Railway

Los 3 servicios (Postgres, `api`, `frontend`) corren en un solo proyecto de Railway, cada app
service desde su Dockerfile existente (sin cambios de código para el build en sí).

## Decisiones de arquitectura

- **CQRS**: Separación de Commands (escritura) y Queries (lectura) para escalabilidad.
- **TypeORM**: ORM con PostgreSQL (dev: auto-sync, prod: migrations manual — pendiente real).
- **JWT anónimo**: Sesión de corta duración sin login de cliente (protege contra spam/CSRF).
- **Modular**: Cada módulo de dominio auto-contenido (commands/queries/events/entities).
- **Next.js App Router + React Query + MUI**: sin librería de date-picker adicional
  (`datetime-local` nativo), sin workspaces compartidos entre frontend/backend (tipos
  calcados manualmente en `frontend/src/types/api.ts`).