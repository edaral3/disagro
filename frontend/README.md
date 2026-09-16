# Disagro — Frontend

Formulario de confirmación de asistencia para la Feria de Promociones de Disagro. Next.js (App
Router) + TypeScript + Material-UI + React Query + React Hook Form/Zod.

Ver el `README.md` y `CLAUDE.md` en la raíz del repo para contexto completo del proyecto
(backend, reglas de negocio, decisiones de arquitectura).

## Desarrollo

Requiere el backend corriendo (ver `../backend/README.md` o `../README.md`).

```bash
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001). La variable `NEXT_PUBLIC_API_URL`
(`.env.local`, ver `.env.example`) apunta al backend — default `http://localhost:3000/api`.

## Scripts

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción (incluye type-check)
npm run start    # sirve el build de producción
npm run lint     # eslint
npm test         # tests unitarios (Jest)
```

## Estructura

- `src/app/` — App Router (`layout.tsx`, `page.tsx`)
- `src/api/` — cliente HTTP tipado por recurso (session, items, registrations)
- `src/hooks/` — `useSession`, `useItems`, `useCreateRegistration` (React Query)
- `src/lib/discount.ts` — espejo puro de las reglas de descuento del backend, para
  previsualización en vivo (el backend sigue siendo la fuente de verdad al confirmar)
- `src/components/` — `RegistrationForm` y sus sub-componentes
- `src/types/api.ts` — tipos calcados de los DTOs reales del backend
