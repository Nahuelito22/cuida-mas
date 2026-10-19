# Contexto del proyecto para agentes (Claude Code u otros)

Cuidá+ es el TP Integrador de **Programación III** (IES 9-023, 2026), con entrega el **03/11/2026**.
Es una red de enfermería domiciliaria con continuidad después del alta: el centro de salud deriva al
paciente con un plan de cuidados, un enfermero verificado acepta la solicitud y registra las visitas
en una bitácora, y el paciente lo califica. Además hay estadística de cobertura por zona (demanda
frente a oferta). Integrantes: Nahuel Ghilardi (@Nahuelito22) y Gustavo Garcia (@GustiGarcia).
Repo: https://github.com/Nahuelito22/cuida-mas

Antes de cambiar algo, leé:
- `README.md`: cómo levantarlo, usuarios de prueba y la tabla de requisitos con dónde se cumple cada uno.
- `docs/arquitectura.md`: estructura, recorrido de un pedido, endpoints REST/GraphQL y dónde vive cada regla de negocio.
- `docs/documento-problematica.md`: el documento breve que pide la consigna.
- `docs/guia-exposicion.md`: guion de la demo, preguntas probables y checklist de entrega.
- `docs/plan-de-trabajo.md`: plan original y lo que cambió.

## Requisitos de la consigna (el PDF no está en el repo)

- Backend NestJS con al menos 2 microservicios, REST y **dos CRUD por GraphQL** (acá: Práctica y Solicitud), MongoDB y Swagger.
- Frontend React con componentes reutilizables y una sección protegida con autenticación.
- Docker y docker-compose.
- Tests: 2 unitarios y 2 e2e en el backend, más tests de frontend.
- README con los integrantes, script de inicialización de la base y documento breve (problemática, solución, microservicios).
- Se evalúan funcionalidad, roles, relaciones y búsquedas.

## Estado (2026-10-19)

- Implementación completa y publicada.
- Tests: 27 unitarios y 3 e2e en el backend, 16 en el frontend. Lint y build sin errores.
- Docker probado de punta a punta.
- El grupo ya revisó la interfaz.
- Falta probar un clon limpio con `docker compose up --build` y aplicar los ajustes que salgan de la revisión.

## Mapa rápido

```
backend/                 monorepo NestJS 11 (un package.json)
  apps/api-gateway       único servicio HTTP: REST + Swagger (/api/docs) + GraphQL (/graphql), JWT, roles, throttler
  apps/auth-service      microservicio TCP (4001): usuarios, bcrypt, emite JWT · base cuidamas_auth
  apps/cuidados-service  microservicio TCP (4002): prácticas, zonas, enfermeros, solicitudes, visitas, reseñas, estadísticas · base cuidamas_cuidados
  libs/common            patrones TCP, enums + máquina de estados, RpcErrors, helpers de Mongo
  scripts/seed.js        datos de demo; es idempotente y --reset recarga todo
frontend/                React 19 + Vite + TypeScript + Tailwind v4 + React Router; nginx en Docker
docker-compose.yml       proyecto "cuida-mas": mongo, seed, auth, cuidados, gateway, frontend
```

## Comandos

```bash
docker compose up --build -d      # todo; frontend en http://localhost:5180 y gateway en :3100
docker compose down               # apagar (con -v también se borra la base)

cd backend
npm ci
npm run lint && npm test && npm run test:e2e   # los tests usan mongodb-memory-server, no hace falta Docker
npm run build

cd frontend
npm ci
npm run lint && npm test && npm run build
npm run dev                       # hace proxy a VITE_GATEWAY_URL (por defecto http://localhost:3100)
```

Usuarios de prueba: `admin@cuidamas.com` / `Admin1234`, `enfermera@cuidamas.com` / `Enfermera123`,
`paciente@cuidamas.com` / `Paciente123`. El resto está en el README.

## Decisiones y trampas conocidas

- **Mongoose está fijado en `^8`.** Con la v9 (driver 7), Jest falla con "Missing required sub-document 'driver'".
- **Los paquetes de Nest están en v11.** La v12 genera conflictos de peer dependencies.
- **Índices de `Enfermero`:** `zonas` y `practicas` son arrays, así que no pueden ir en el mismo índice compuesto ("cannot index parallel arrays").
- **Fechas en GraphQL:** se exponen como `String`, porque el escalar DateTime devolvía null.
- **`isolatedModules`:** los tipos que se usan en firmas decoradas se importan con `import type`.
- **Errores entre servicios:** los microservicios lanzan `RpcErrors.*` (`{statusCode, message}`). El gateway los convierte en `HttpException`; si el servicio tarda devuelve 504 y si está caído, 503.
- **Lógica de negocio:** vive solo en los microservicios. El gateway autentica, autoriza por rol, valida y reenvía.
- **Guards globales del gateway:** `GqlThrottlerGuard` → `JwtAuthGuard` (`@Public()` para excepciones) → `RolesGuard` (`@Roles(...)`).
- **Máquina de estados de la solicitud:** PENDIENTE → ACEPTADA → EN_CURSO (con la primera visita) → FINALIZADA, o CANCELADA. La aceptación es atómica con `findOneAndUpdate({estado: PENDIENTE})`.
- **Docker aislado:** el proyecto compose se llama `cuida-mas` y usa puertos de host poco comunes (5180, 3100, 27030). No tocar configuración global ni otros contenedores de la PC.
- **Fin de línea:** se fuerza LF con `.gitattributes`.
- **Frontend:** los helpers que no son componentes van en archivos aparte (`auth/sesion.ts`, `utils/validaciones.ts`), porque oxlint exige `only-export-components`.

## Convenciones

- El código, los mensajes y la documentación están en **español**, y los nombres de dominio también (`solicitudes`, `enfermeros`, `crearSolicitud`).
- Gestor de paquetes: **npm**.
- Cualquier cambio de comportamiento lleva su test y su actualización en `docs/` o en el README.
