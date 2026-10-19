# Guía para la exposición y la revisión

## Orden sugerido (≈ 15 minutos)

1. **Problema (2 min)** — el alta no es el final del tratamiento. Continuidad, garantías y desigualdad
   territorial (ver `documento-problematica.md`).
2. **Solución (2 min)** — tres actores, ciclo de una solicitud (diagrama de estados).
3. **Arquitectura (3 min)** — gateway + 2 microservicios por TCP, una base por servicio, todo en Docker.
   Mostrar el diagrama del README y `docker compose ps`.
4. **Demo en vivo (6 min)** — ver guion abajo.
5. **Calidad (2 min)** — correr los tests, mostrar Swagger y el explorador GraphQL, logs del gateway.

## Guion de la demo

Levantar antes: `docker compose up -d` y abrir http://localhost:5180.

| # | Quién | Acción | Qué demuestra |
|---|---|---|---|
| 1 | Centro (`admin@cuidamas.com` / `Admin1234`) | **Cobertura**: Lavalle y Palmira aparecen en *crítica* | Estadística por zona |
| 2 | Centro | **Derivar paciente**: buscar "Díaz", cargar plan en *Villa Nueva* con *Control de signos vitales* | Gateway combina auth + cuidados, GraphQL `crearSolicitud` |
| 3 | Centro | **Enfermeros → Pendientes**: verificar a Diego Molina | Rol ADMIN, REST `PATCH /verificacion` |
| 4 | Centro | **Prácticas**: crear "Nebulización", desactivar, intentar borrar "Curación de heridas" (error 409, está en uso) | CRUD GraphQL #1 + regla de negocio |
| 5 | Enfermera (`enfermera@cuidamas.com` / `Enfermera123`) | **Disponibles**: aparece la derivación de Jorge Díaz → Aceptar | Compatibilidad zona/prácticas, M:N |
| 6 | Enfermera | **Mis pacientes**: registrar visita con PA 120/80 → pasa a *En curso*; ver bitácora de Rosa | Bitácora, máquina de estados |
| 7 | Paciente (`paciente@cuidamas.com` / `Paciente123`) | Ver bitácora; pedir cuidados nuevos; calificar la solicitud finalizada | CRUD GraphQL #2 + reseñas |
| 8 | Sin sesión | Entrar a http://localhost:5180/app/panel → redirige a login. Con paciente → no puede entrar al panel | Sección protegida + roles |

## Preguntas probables del profesor

**¿Por qué un API Gateway?**
Es la única puerta de entrada. Centraliza seguridad (JWT, roles, rate limit), validación y
documentación. Los microservicios quedan en la red interna de Docker, sin puertos publicados.

**¿Cómo se comunican los microservicios?**
Por TCP con `@nestjs/microservices` (request/response con `client.send(patrón, datos)`). Los nombres
de los patrones están en `libs/common/src/patterns.ts` y los comparten emisor y receptor.

**¿Por qué dos bases de datos?**
Cada microservicio es dueño de sus datos (patrón *database per service*). Por eso la solicitud guarda
una copia del nombre del paciente, y el gateway combina datos de ambos servicios cuando hace falta.

**¿Dónde están las relaciones muchos-a-muchos?**
`Enfermero.practicas[]` y `Enfermero.zonas[]` (arrays de ObjectId con `ref` + `populate`). Se testean
en `enfermeros.service.spec.ts`. También `Solicitud.practicas[]`.

**¿Qué pasa si dos enfermeros aceptan a la vez?**
`findOneAndUpdate` con la condición `estado: PENDIENTE` es atómico: el segundo recibe 409.

**¿Cómo se protege la contraseña?**
bcrypt (10 rondas), el hash tiene `select: false` (nunca se devuelve) y el login no revela si el email existe.

**¿Cómo se testea sin Docker?**
`mongodb-memory-server` levanta un MongoDB real en memoria. Los e2e arrancan el gateway HTTP y los
dos microservicios TCP reales en el mismo proceso.

**¿Por qué el CRUD en GraphQL y las acciones en REST?**
GraphQL permite pedir la solicitud con sus relaciones en una sola consulta. Las transiciones de estado
son acciones con reglas propias; como verbos REST quedan explícitas y documentadas en Swagger.

## Checklist de revisión antes de entregar

- [ ] Completar nombres de integrantes en el `README.md`.
- [ ] Clonar el repo en una carpeta limpia y correr `docker compose up --build`.
- [ ] Ingresar con los tres usuarios de prueba y recorrer el guion.
- [ ] `cd backend && npm ci && npm test && npm run test:e2e`.
- [ ] `cd frontend && npm ci && npm test`.
- [ ] Abrir Swagger y GraphQL y probar un endpoint de cada uno.
- [ ] Cambiar `JWT_SECRET` en `.env` si se publica en algún lado.
