# Diagramas — Disagro (Mermaid)

5 diagramas en formato [Mermaid](https://mermaid.js.org/): texto plano, versionable en git y
renderizado nativo en GitHub, VS Code (con la extensión Markdown Preview Mermaid Support) y en
artifacts de Claude.

## 1. Arquitectura general

```mermaid
flowchart LR
    FE["Frontend — Next.js (App Router)<br/>Material-UI + React Query + RHF/Zod<br/>/confirmar-asistencia · /registrations"]

    subgraph BE["Backend — NestJS + CQRS"]
        direction TB
        S["Session Module<br/>JWT anónimo (3 min)"]
        I["Items Module<br/>GET /items (search, type, price, sort)"]
        R["Registrations Module<br/>POST /registrations ← SessionGuard<br/>GET /registrations · GET /registrations/:id (público)"]
        C["Common — DiscountCalculatorService<br/>(lógica pura, sin deps de NestJS)"]
        X["ValidationPipe · HttpExceptionFilter · LoggingInterceptor"]
    end

    DB[("PostgreSQL<br/>items · registrations · registration_items<br/>(dev: synchronize=true)")]

    FE -->|"1. POST /session/start (sin auth)"| S
    FE -->|"2. GET /items (Bearer token)"| I
    FE -->|"3. POST /registrations (Bearer token)"| R
    R --> C
    I -->|TypeORM| DB
    R -->|TypeORM| DB
```

**Descuentos** (independientes): Servicios ≥2 → 3% · ≥2 y suma > Q.1,500 → 5% · Productos ≥3 → 3% · ≥5 → 5%.

## 2. CQRS por módulo (backend)

```mermaid
flowchart TB
    subgraph ITEMS["ITEMS MODULE (Reads)"]
        I1["Query: GetItemsQuery<br/>Handler: GetItemsHandler → SELECT items<br/>(filtros: search ILIKE, type, minPrice, maxPrice, sortBy)<br/>Controller: GET /items<br/>Entity: Item (id, name, description, price, type, category, active, ...)"]
    end

    subgraph SESSION["SESSION MODULE (Stateless JWT)"]
        S1["Controller: POST /session/start → firma JWT anónimo<br/>Guard: SessionGuard → valida Bearer token en rutas protegidas<br/>Duración: 3 minutos (exp real, corregido 2026-09-16)<br/>Sin base de datos — validación JWT pura"]
    end

    subgraph REG["REGISTRATIONS MODULE (Reads + Writes)"]
        R1["Command: CreateRegistrationCommand<br/>Handler: CreateRegistrationHandler<br/>1. Validar: email único (409), fecha futura (400), items existen (404), min 1 ítem<br/>2. DiscountCalculatorService.calculateDiscounts()<br/>3. INSERT Registration + RegistrationItem[] (price snapshot)<br/>4. Emit RegistrationConfirmedEvent<br/>Controller: POST /registrations ← SessionGuard"]
        R2["Query: GetRegistrationByIdQuery / ListRegistrationsQuery<br/>Handlers: SELECT con relations (items) / SELECT con búsqueda ILIKE + orden por fecha<br/>Controller: GET /registrations/:id · GET /registrations?search=&sortBy= (sin SessionGuard)"]
    end

    subgraph COMMON["COMMON SERVICES (Domain Logic)"]
        C1["DiscountCalculatorService (pura, sin deps de NestJS)<br/>calculateDiscounts(items: SelectedItem[])<br/>Servicios: ≥2 → 3% · ≥2 y suma&gt;Q.1,500 → 5%<br/>Productos: ≥3 → 3% · ≥5 → 5% (independientes, no se suman)"]
    end

    subgraph CROSS["CROSS-CUTTING CONCERNS (Global)"]
        X1["ValidationPipe: whitelist de DTOs, rechaza campos desconocidos<br/>HttpExceptionFilter: normaliza respuestas de error<br/>LoggingInterceptor: loguea requests/responses con duración"]
    end

    R1 -.usa.-> C1
```

## 3. Modelo entidad-relación (PostgreSQL)

```mermaid
erDiagram
    ITEMS {
        uuid id PK
        varchar_255 name
        text description
        decimal_10_2 price
        enum type "SERVICE | PRODUCT"
        varchar_100 category
        boolean active
        timestamp createdAt
        timestamp updatedAt
    }
    REGISTRATIONS {
        uuid id PK
        varchar_100 firstName
        varchar_100 lastName
        varchar_255 email UK
        timestamp eventDateTime
        smallint servicesDiscountPct
        smallint productsDiscountPct
        timestamp createdAt
        timestamp updatedAt
    }
    REGISTRATION_ITEMS {
        uuid id PK
        uuid registrationId FK
        uuid itemId FK
        enum itemType "SERVICE | PRODUCT"
        decimal_10_2 priceSnapshot "congela el precio al confirmar"
    }

    REGISTRATIONS ||--o{ REGISTRATION_ITEMS : "1:N"
    ITEMS ||--o{ REGISTRATION_ITEMS : "1:N"
```

## 4. Secuencia de una confirmación

```mermaid
sequenceDiagram
    participant C as Cliente (Next.js)
    participant A as API (NestJS)
    participant D as DB (PostgreSQL)

    C->>A: POST /session/start
    A->>A: sign JWT (exp = 3 min)
    A-->>C: 200 { token, expiresIn }

    C->>A: GET /items?search=&type=&minPrice=&maxPrice=&sortBy= (Bearer token)
    A->>D: SELECT items (filtros)
    D-->>A: rows
    A-->>C: 200 [Item1, Item2, ...]

    C->>A: POST /registrations (Bearer token) {firstName,lastName,email,eventDateTime,selectedItemIds}
    A->>A: verify JWT · validar email único, fecha futura, min 1 ítem
    A->>D: SELECT items (validar existencia)
    D-->>A: rows
    A->>A: DiscountCalculatorService.calculateDiscounts()
    A->>D: INSERT registrations
    D-->>A: ok
    A->>D: INSERT registration_items (priceSnapshot)
    D-->>A: ok
    A->>A: emit RegistrationConfirmedEvent
    A-->>C: 201 { id, servicesDiscountPct, productsDiscountPct }

    C->>A: GET /registrations/:id
    A->>D: SELECT with relations (items)
    D-->>A: rows
    A-->>C: 200 { detalles completos }

    Note over C,A: Vista /registrations (listado)
    C->>A: GET /registrations?search=&sortBy= (sin auth)
    A->>D: SELECT registrations (ILIKE + orden por fecha)
    D-->>A: rows
    A-->>C: 200 [ Registration1, Registration2, ... ]
```

## 5. Deployment en Railway (✅ live)

```mermaid
flowchart TB
    DEV["Local (dev machine)<br/>git commit + railway up"]
    BROWSER["Navegador del cliente"]

    subgraph RW["Railway — Proyecto 'disagro' (workspace edaral3)"]
        FRONT["Servicio: frontend<br/>Dockerfile multi-stage (Next.js standalone)<br/>build.builder = DOCKERFILE<br/>NEXT_PUBLIC_API_URL embebido en build time<br/>Dominio público (puerto 3000)"]
        API["Servicio: api<br/>Dockerfile multi-stage (npm ci --omit=dev --omit=optional)<br/>build.builder = DOCKERFILE<br/>Dominio público (puerto 3000)"]
        PG[("Servicio: Postgres (managed)<br/>Red privada de Railway (no público)<br/>DB_SYNCHRONIZE=true (sin migraciones aún)")]
    end

    DEV -->|"railway up ./backend --service api<br/>railway up ./frontend --service frontend"| RW
    BROWSER -->|HTTPS| FRONT
    BROWSER -->|"fetch /api (NEXT_PUBLIC_API_URL)"| API
    FRONT -.->|"vars cruzadas: FRONTEND_URL (CORS), JWT_SECRET, JWT_EXPIRATION=180"| API
    API -->|"TypeORM (red privada)"| PG
```