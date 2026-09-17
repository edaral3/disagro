# Diagramas — Disagro

Archivos `.drawio` (formato mxGraph/diagrams.net). Abrir en https://app.diagrams.net
("File → Open from → Device") o en la extensión Draw.io Integration de VS Code.

- `01-arquitectura-general.drawio` — Frontend (Next.js) ↔ Backend (NestJS) ↔ PostgreSQL, flujo de las 3 llamadas principales.
- `02-cqrs-backend.drawio` — Desglose por módulo NestJS (Items, Session, Registrations, Common, cross-cutting) con Commands/Queries/Handlers.
- `03-modelo-er.drawio` — Modelo entidad-relación de `items`, `registrations` y `registration_items` (tabla junction con price snapshot).
- `04-secuencia-confirmacion.drawio` — Diagrama de secuencia completo: sesión → listar ítems → crear confirmación → consultar detalle.
- `05-deployment-railway.drawio` — Topología real del despliegue en Railway (servicios `api`, `frontend`, `Postgres`, variables cruzadas, seed one-off, pendientes).

Reflejan el estado actual del proyecto (JWT de 3 min, deploy ya en producción en Railway, 15 ítems en el seed), no el estado desactualizado que aparece en algunas secciones de `ARCHITECTURE.md`.
