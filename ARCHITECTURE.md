# Arquitectura de Disagro

## Diagrama de flujo del cliente

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
│  [Formulario 2 pasos]  [Material-UI]  [React Query]             │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ 1. POST /api/session/start
               ▼ (sin auth, anónimo)
         ┌──────────────┐
         │ JWT Token    │  30 min duration
         └────┬─────────┘
              │ (Bearer token en Header)
              │
              │ 2. GET /api/items?type=SERVICE&search=...
              ▼ (listar servicios/productos)
         ┌──────────────────┐
         │ [Item 1]         │
         │ [Item 2]         │
         │ ...              │
         └─────────────────┘
         
         (Cliente selecciona ítems: múltiples servicios y/o productos)
              │
              │ 3. POST /api/registrations
              │    { firstName, lastName, email, eventDateTime, selectedItemIds }
              │    (con Bearer token en Header)
              ▼
```

## Backend: CQRS Architecture por módulo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NESTJS API                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ITEMS MODULE                    (Reads)                      │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Query:  GetItemsQuery                                        │   │
│  │ Handler: GetItemsHandler → SELECT from items (con filtros)  │   │
│  │ Controller: GET /items?type=&search=                        │   │
│  │ Entity: Item (id, name, price, type, category, active)     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ SESSION MODULE                  (Stateless JWT)              │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Controller: POST /session/start → sign JWT (anónimo)        │   │
│  │ Guard: SessionGuard → validate Bearer token                 │   │
│  │ (No database, pure JWT validation)                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ REGISTRATIONS MODULE            (Reads + Writes)            │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Command: CreateRegistrationCommand (intent to confirm)      │   │
│  │ Handler: CreateRegistrationHandler                          │   │
│  │   - Validate: duplicate email, future date, items exist     │   │
│  │   - Call: DiscountCalculatorService.calculateDiscounts()    │   │
│  │   - Insert: Registration + RegistrationItems (snapshot)     │   │
│  │   - Emit: RegistrationConfirmedEvent                        │   │
│  │                                                               │   │
│  │ Query: GetRegistrationByIdQuery (fetch details)             │   │
│  │ Handler: GetRegistrationByIdHandler → SELECT with relations │   │
│  │                                                               │   │
│  │ Controller:                                                  │   │
│  │   POST /registrations ← SessionGuard (Bearer token)         │   │
│  │   GET /registrations/:id                                    │   │
│  │                                                               │   │
│  │ Entities:                                                    │   │
│  │   Registration (id, firstName, lastName, email,             │   │
│  │     eventDateTime, servicesDiscountPct,                     │   │
│  │     productsDiscountPct, createdAt, items:FK)              │   │
│  │   RegistrationItem (id, registrationId:FK, itemId,          │   │
│  │     itemType, priceSnapshot)                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ COMMON SERVICES                 (Domain Logic)               │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ DiscountCalculatorService (pure, no NestJS deps)            │   │
│  │   calculateDiscounts(items: SelectedItem[])                 │   │
│  │   → { servicesDiscountPct, productsDiscountPct }            │   │
│  │                                                               │   │
│  │   Reglas:                                                    │   │
│  │   - Servicios: ≥2 → 3%,  ≥2 AND suma>1500 → 5%             │   │
│  │   - Productos: ≥3 → 3%, ≥5 → 5%                            │   │
│  │   - Independientes (no se suman)                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ CROSS-CUTTING CONCERNS          (Global)                     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ ValidationPipe: whitelist DTOs, forbid unknown fields        │   │
│  │ HttpExceptionFilter: normalize error responses               │   │
│  │ LoggingInterceptor: log all requests with duration           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ HTTP Responses (JSON)
         ▼
```

## Base de datos: PostgreSQL

```
┌──────────────────────────────────────┐
│           DISAGREO DATABASE           │
├──────────────────────────────────────┤
│                                       │
│  ┌─ items                            │
│  │  ├─ id (PK, UUID)                │
│  │  ├─ name (varchar 255)           │
│  │  ├─ description (text)           │
│  │  ├─ price (decimal 10,2)         │
│  │  ├─ type (enum: SERVICE, PRODUCT)│
│  │  ├─ category (varchar 100)       │
│  │  ├─ active (boolean)             │
│  │  ├─ createdAt (timestamp)        │
│  │  └─ updatedAt (timestamp)        │
│  │  [Indexes: type, active]         │
│  │                                   │
│  │  Registros seed: 11 items        │
│  │  (5 servicios, 6 productos)      │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                │                     │
│                │ (1:N)               │
│                │                     │
│  ┌─ registrations                   │
│  │  ├─ id (PK, UUID)                │
│  │  ├─ firstName (varchar 100)      │
│  │  ├─ lastName (varchar 100)       │
│  │  ├─ email (varchar 255)          │
│  │  ├─ eventDateTime (timestamp)    │
│  │  ├─ servicesDiscountPct (smallint)│
│  │  ├─ productsDiscountPct (smallint)│
│  │  ├─ createdAt (timestamp)        │
│  │  └─ updatedAt (timestamp)        │
│  │  [Indexes: email, createdAt]     │
│  │                                   │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                │                     │
│                │ (1:N)               │
│                │                     │
│  ┌─ registration_items (junction)   │
│  │  ├─ id (PK, UUID)                │
│  │  ├─ registrationId (FK → reg)   │
│  │  ├─ itemId (FK → items.id)      │
│  │  ├─ itemType (enum: S/P)         │
│  │  └─ priceSnapshot (decimal)      │
│  │                                   │
│  │  Propósito: congelar precios     │
│  │  al momento de confirmar         │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                       │
└──────────────────────────────────────┘
```

## Flujo de una confirmación (secuencia)

```
Cliente                  API                  DB
   │                      │                    │
   │─ POST /session/start ─►                  │
   │                      ├─ sign JWT ─────┐  │
   │ ◄─ { token }         │                │  │
   │                      │ ◄────────────  │  │
   │                      │                   │
   │ GET /items           │                   │
   │─────────────────────►│                   │
   │                      ├─ SELECT items     │
   │                      ├──────────────────►│
   │                      │                   │
   │ ◄─ [Item1, Item2..] ─│ ◄──────────────   │
   │                      │                   │
   │ POST /registrations  │                   │
   │ Bearer: <token>      │                   │
   │─────────────────────►│                   │
   │                      ├─ verify JWT       │
   │                      ├─ validate email   │
   │                      ├─ validate date    │
   │                      ├─ SELECT items     │
   │                      ├──────────────────►│
   │                      │ ◄──────────────   │
   │                      ├─ calc discounts   │
   │                      ├─ INSERT reg       │
   │                      ├──────────────────►│
   │                      ├─ INSERT reg_items │
   │                      ├──────────────────►│
   │                      │ ◄──────────────   │
   │                      ├─ emit event       │
   │ ◄─ { id, disc% }     │                   │
   │                      │                   │
   │ GET /registrations/id│                   │
   │─────────────────────►│                   │
   │                      ├─ SELECT with rels│
   │                      ├──────────────────►│
   │                      │ ◄──────────────   │
   │ ◄─ { full details }  │                   │
   │                      │                   │
```

## Deployment (pendiente)

```
┌──────────────┐
│ Git repo     │
│ (GitHub)     │
└──────┬───────┘
       │ Push
       ▼
┌──────────────┐
│ CI/CD Pipe   │      [GitHub Actions o similar]
│ (build tests)│
└──────┬───────┘
       │ on: push to main
       ▼
┌──────────────────────────────┐
│ Cloud (AWS/GCP/Railway/etc)  │
├──────────────────────────────┤
│                               │
│  ┌─────────────────────────┐ │
│  │ Docker Registry         │ │
│  │ (ghcr.io o Docker Hub) │ │
│  └────────────┬────────────┘ │
│               │               │
│               ▼               │
│  ┌──────────────────────────┐ │
│  │ Backend Container        │ │
│  │ (NestJS + Node 20)       │ │
│  └──────────────┬───────────┘ │
│                 │              │
│                 ▼              │
│  ┌──────────────────────────┐ │
│  │ PostgreSQL (Managed)     │ │
│  │ - backups auto           │ │
│  │ - replication            │ │
│  └──────────────────────────┘ │
│                               │
│  Domain: api.disagro.dev      │
│  HTTPS: Auto-cert            │
│                               │
└──────────────────────────────┘
```

## Decisiones clave

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| **Architecture** | CQRS | Escalabilidad, separación lectura/escritura |
| **DB** | PostgreSQL | Relacional, JSONB, transacciones ACID |
| **Session** | JWT anónimo | Sin estado, corta duración, CSRF protection |
| **Validación** | class-validator DTOs | Type-safe, automática, reutilizable |
| **Descuentos** | Servicio puro (no NestJS) | Testeable sin framework, lógica aislada |
| **Docker** | Multi-stage | Imágenes pequeñas, build separado de runtime |

---

**Siguiente**: Frontend Next.js + Material-UI + React Query
