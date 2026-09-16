---
name: disagro-rules
description: Usar siempre que se trabaje en el backend o frontend de la plataforma de confirmación de asistencia de Disagro — específicamente al implementar o modificar el cálculo de descuentos, al crear/extender cualquier módulo NestJS con CQRS, o al tomar decisiones de arquitectura ya acordadas con el cliente. Contiene el conocimiento de negocio y las convenciones propias de este proyecto que ningún skill genérico (nestjs-expert, api-designer, etc.) puede conocer.
---

# Disagro — Reglas y convenciones del proyecto

Esta skill centraliza el conocimiento **específico de Disagro** que no está en ningún skill genérico del pack (nestjs-expert, api-designer, architecture-designer, secure-code-guardian, etc.). Úsala junto con esos skills, no en su lugar: ellos aportan las buenas prácticas generales de NestJS/Next.js/TypeScript; esta skill aporta las reglas de negocio y decisiones ya tomadas para este proyecto puntual.

## 1. Reglas de descuento (fuente: enunciado original de la prueba técnica)

Los descuentos de **Servicios** y **Productos** se calculan de forma **independiente** — no se suman entre sí, se muestran como dos porcentajes separados (así lo muestra el mockup del formulario: dos badges, "Descuento en Servicios" y "Descuento en Productos").

### Servicios

| Condición | Descuento |
|---|---|
| Interés en ≥ 2 servicios | 3% |
| Interés en ≥ 2 servicios **y** la suma de precios de esos servicios > Q.1,500 | 5% |

- El 5% **reemplaza** al 3%, no se suman (mutuamente excluyentes; se aplica el mayor que corresponda).
- 0 o 1 servicio seleccionado → 0% de descuento en servicios.
- El umbral es estrictamente mayor a Q.1,500 (`> 1500`, no `>= 1500`). Un total de exactamente Q.1,500.00 con 2+ servicios da 3%, no 5%.

### Productos

| Condición | Descuento |
|---|---|
| Interés en ≥ 3 productos | 3% |
| Interés en ≥ 5 productos | 5% |

- El 5% reemplaza al 3% (mutuamente excluyentes, se aplica el mayor).
- 0, 1 o 2 productos seleccionados → 0% de descuento en productos.
- El precio de los productos **no** afecta este descuento (a diferencia de servicios), solo la cantidad.

### Casos límite obligatorios en tests unitarios

- Exactamente 2 servicios con suma = Q.1,500.00 exacto → 3% (no 5%).
- Exactamente 2 servicios con suma = Q.1,500.01 → 5%.
- 1 servicio con precio alto (ej. Q.5,000) → 0% (no cumple la cantidad mínima).
- Exactamente 3 productos → 3%.
- Exactamente 5 productos → 5%.
- 4 productos → 3% (no alcanza el umbral de 5).
- 0 ítems en una categoría pero ≥1 en la otra → registro válido, 0% solo en la categoría vacía.

### Dónde vive esta lógica

Debe implementarse como un servicio de dominio puro (`DiscountCalculatorService`), sin dependencias de NestJS/TypeORM, invocado desde el Command Handler de `CreateRegistrationCommand`. Esto permite testear las reglas exhaustivamente sin levantar el framework ni la base de datos.

## 2. Convención de estructura CQRS por módulo

Ningún skill genérico del pack fija esta convención de carpetas — es la que se acordó para este backend. Cada módulo de dominio en `backend/src/` sigue esta estructura:

```
module-name/
├── commands/
│   ├── impl/                     # *.command.ts — DTO de intención (input inmutable)
│   └── handlers/                 # *.handler.ts — un handler por command
├── queries/
│   ├── impl/                     # *.query.ts
│   └── handlers/                 # *.handler.ts — un handler por query
├── events/                       # *.event.ts + *.event-handler.ts (eventos de dominio)
├── entities/                     # entidades TypeORM (*.entity.ts)
├── dto/                          # DTOs HTTP de entrada/salida, con class-validator
├── module-name.controller.ts     # solo despacha a CommandBus/QueryBus, sin lógica de negocio
└── module-name.module.ts
```

Reglas:
- Los controllers **nunca** contienen lógica de negocio: solo mapean HTTP → Command/Query.
- Un Command/Query = un Handler. Nombre en singular: `create-registration.command.ts` → `CreateRegistrationCommand`.
- Commands mutan estado; Queries son de solo lectura.
- Los eventos de dominio (ej. `RegistrationConfirmedEvent`) se emiten desde el Command Handler tras persistir, nunca desde el controller.
- La lógica de negocio pura va en servicios de dominio separados (ver `DiscountCalculatorService` arriba), inyectados en el handler.
- Las entidades TypeORM no se exponen directamente en respuestas HTTP — se mapean a un DTO de salida.

## 3. Modelo de dominio acordado

- `Item`: id, name, description, price, type (`SERVICE` | `PRODUCT`), category?, active.
- `Registration`: id, firstName, lastName, email, eventDateTime, servicesDiscountPct, productsDiscountPct, createdAt.
- `RegistrationItem` (unión): registrationId, itemId, itemType, priceSnapshot — el precio se congela al momento de confirmar, no depende de cambios futuros de precio del `Item`.

## 4. Decisiones de proyecto ya confirmadas (no volver a preguntar)

- **Repo**: monorepo simple con carpetas separadas `backend/` y `frontend/`, cada uno con su propio `package.json` y `Dockerfile` (sin workspaces compartidos).
- **Gestor de paquetes**: npm.
- **Endpoint de ítems**: uno solo con filtro — `GET /items?search=texto&type=SERVICE|PRODUCT&minPrice=&maxPrice=&sortBy=price_asc|price_desc` — no endpoints separados para servicios/productos. `type` ausente = ambos tipos. `sortBy` ausente = orden por nombre ascendente (default original). Filtro de precio y orden agregados como panel de filtros junto al buscador en el frontend (`ItemsFilterMenu.tsx`), aplicados en vivo (sin botón "Aplicar"), igual que la búsqueda de texto.
- **Sesión (Plus)**: JWT anónimo de corta duración emitido en `POST /session/start`, sin login de usuario final (los clientes no tienen cuentas). Protege `POST /registrations` contra spam/CSRF y habilita idempotencia básica.
- **Base de datos**: PostgreSQL.
- **Stack backend**: NestJS + CQRS (`@nestjs/cqrs`) + TypeORM.
- **Stack frontend**: Next.js (App Router) + Material-UI + React Query + React Hook Form + Zod.
  Completo y verificado end-to-end (dev y dockerizado) — ver README.md sección "Frontend".
- **Orden de trabajo**: backend primero, completo y validado, antes de tocar frontend (cumplido).
- **Despliegue**: Railway (proyecto `disagro`, workspace `edaral3`), 3 servicios (Postgres, api,
  frontend) cada uno desde su Dockerfile. URLs y comando de reproducción en README.md sección
  "Despliegue en Railway". `DB_SYNCHRONIZE=true` en producción (no hay migraciones todavía —
  ver `backend/src/app.module.ts`, flag independiente de `NODE_ENV`).
- **`selectedItemIds`**: array plano de UUID strings (`string[]`), no objetos `{id}` — el nombre
  del campo debe coincidir con su forma real.
- **Descuento en vivo del frontend**: `frontend/src/lib/discount.ts` es un espejo puro de
  `DiscountCalculatorService`, solo para previsualización mientras el cliente selecciona ítems.
  El backend sigue siendo la única fuente de verdad al confirmar. Si cambian las reglas de
  descuento, actualizar AMBAS implementaciones (y sus tests de paridad).
- **CORS**: habilitado en `backend/src/main.ts` vía `FRONTEND_URL` (env var, default
  `http://localhost:3001`) — necesario porque frontend y backend corren en orígenes distintos.

## 5. Gotchas de infraestructura (no repetir el diagnóstico)

- **`better-sqlite3` (devDependency del backend, solo para el e2e) rompe el build de Docker**:
  TypeORM la lista como `optionalDependency` de todos sus drivers, así que el lockfile la marca
  `devOptional` en vez de `dev` — `npm ci --omit=dev` sola no la excluye. Fix: runtime stage con
  `--omit=dev --omit=optional`; builder stage instala `python3 make g++` vía apk (se descarta
  con la etapa) porque sí necesita las devDependencies reales para compilar.
- **`NEXT_PUBLIC_*` se embebe en build time, no runtime**: en `docker-compose.yml` va como
  `build.args`, nunca `environment:`, y debe apuntar a la URL que ve el navegador del cliente
  (puerto publicado en el host), no al nombre del servicio en la red interna de Docker.
- **MUI v9** (más nueva de lo usual): `Grid` usa `size={{xs:..}}` en vez de `item xs={}`;
  `Stack`/`Typography` ya no aceptan `alignItems`/`display` como props directas (usar `sx`).
- **Next.js 16**: Turbopack es default, `next lint` fue removido (usar `eslint` directo). El
  proyecto trae `node_modules/next/dist/docs/` versionado — consultarlo ante dudas de API en
  vez de asumir comportamiento de versiones anteriores.

## 6. Al tomar una decisión nueva de arquitectura o negocio

Si surge una decisión que no está en esta lista (ej. un nuevo campo, una regla de descuento adicional, un cambio de stack), añádela a la sección correspondiente de este archivo después de confirmarla con el usuario, para que quede disponible en sesiones futuras.
