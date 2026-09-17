# Arquitectura de Disagro

Diagramas (arquitectura general, CQRS por módulo, modelo ER, secuencia de confirmación y
topología de deployment en Railway) en
[`documentation/diagramas-mermaid.md`](documentation/diagramas-mermaid.md) — Mermaid, se
renderiza directo en GitHub, VS Code y en la página de presentación del proyecto.

Detalle de la configuración de Railway, variables y gotchas en `README.md` sección
"Despliegue en Railway".

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

**Estado**: backend, frontend y deploy en Railway completos y verificados. Ver `README.md`
para el detalle de estado, pruebas y demo en vivo.
