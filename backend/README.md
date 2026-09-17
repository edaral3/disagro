# Disagro — Backend

API NestJS (CQRS + TypeORM + PostgreSQL) para la confirmación de asistencia. Ver el `README.md`
y `CLAUDE.md` en la raíz del repo para contexto completo del proyecto (frontend, reglas de
negocio, decisiones de arquitectura, deploy).

## Desarrollo

Requiere PostgreSQL local en `localhost:5432` (o usar `docker compose up` desde la raíz).

```bash
npm install
npm run start:dev
npm run db:seed   # una vez, carga los ítems de ejemplo (idempotente)
```

Swagger en `http://localhost:3000/api/docs`.

## Scripts

```bash
npm run start:dev    # servidor de desarrollo (watch mode)
npm run build        # build de producción
npm run start:prod   # sirve el build de producción
npm run lint         # eslint
npm test             # unit tests (DiscountCalculatorService)
npm run test:e2e     # e2e — flujo completo vía SQLite en memoria, sin Docker/Postgres
npm run test:cov     # coverage
```

## Estructura

Cada módulo de dominio (`items/`, `registrations/`, `session/`) sigue la misma convención CQRS:
`commands/` (impl + handlers), `queries/` (impl + handlers), `entities/`, `dto/`, un controller
que solo despacha a `CommandBus`/`QueryBus` sin lógica de negocio, y su `.module.ts`. Detalle
completo de la convención y las reglas de negocio en
[`.claude/skills/disagro-rules/SKILL.md`](../.claude/skills/disagro-rules/SKILL.md).

- `common/` — `DiscountCalculatorService` (lógica pura de descuentos), filters, interceptors
- `database/` — seed (`items.seed.ts` + runner) y config de TypeORM
- `test/registration-flow.e2e-spec.ts` — e2e del flujo completo
