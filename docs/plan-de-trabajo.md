# Plan de trabajo — TP Integrador Programación III (2026)

> Plan inicial. Cambio respecto de este plan: los tres servicios NestJS quedaron en un **monorepo de Nest**
> (`backend/apps/*` + `backend/libs/common`) en lugar de tres carpetas sueltas, y los perfiles de
> enfermero viven en `cuidados-service` (junto a prácticas y zonas) para poder resolver las relaciones
> muchos-a-muchos con `populate`. La estructura final está en [arquitectura.md](arquitectura.md).

> Entrega: **03/11/2026**. Todo corre local con Docker (sin deploy).

## 1. Problemática y solución

**Problema:** cuando un paciente recibe el alta (hospital o salita) y necesita cuidados de enfermería
en su casa (curaciones, inyectables, control de presión, sondas), el seguimiento se corta: la familia
busca enfermeros "de boca en boca", no hay garantía de matrícula y el centro que dio el alta no sabe
cómo evoluciona el paciente. Además, hay zonas (departamentos alejados) con poca oferta de enfermería.

**Solución — red de enfermería domiciliaria con continuidad post-alta:**
1. El **centro de salud deriva** al paciente con un *plan de cuidados* (prácticas, frecuencia, fechas, zona).
   El paciente/familiar también puede crear una solicitud por su cuenta.
2. **Enfermeros matriculados y verificados** por el admin, que atienden esa zona y realizan esas prácticas,
   ven la solicitud y la aceptan.
3. Cada visita se registra en una **bitácora** visible para paciente, familia y centro.
4. Al finalizar, el paciente **califica** al enfermero.
5. **Estadística de cobertura por zona**: demanda (solicitudes) vs. oferta (enfermeros verificados).

## 2. Roles

| Rol | Puede |
|---|---|
| `ADMIN` (centro de salud) | Verificar matrículas, crear derivaciones, gestionar catálogo de prácticas y zonas, ver estadísticas |
| `ENFERMERO` | Completar su perfil (matrícula, zonas, prácticas), ver/aceptar solicitudes compatibles, registrar visitas |
| `PACIENTE` (o familiar a cargo) | Crear solicitudes, ver su bitácora, cancelar, calificar |

## 3. Modelo de datos (MongoDB)

```
Usuario        { email (único), passwordHash, nombre, apellido, dni, telefono, rol, activo }
PerfilEnfermero{ usuarioId, matricula (única), verificado, zonas[] -> Zona, practicas[] -> Practica, bio }
Practica       { nombre (único), descripcion, duracionEstimadaMin }       // catálogo
Zona           { nombre (único), departamento }                            // ej. Las Heras, Lavalle
Solicitud      { pacienteId, enfermeroId?, centroOrigen?, zonaId, practicas[], direccion,
                 fechaInicio, fechaFin, frecuencia, observaciones,
                 estado: PENDIENTE | ACEPTADA | EN_CURSO | FINALIZADA | CANCELADA }
Visita         { solicitudId, enfermeroId, fecha, practicasRealizadas[], observaciones, signos? }
Resena         { solicitudId (única), pacienteId, enfermeroId, puntaje 1-5, comentario }
```

- **Muchos-a-muchos:** `Enfermero ↔ Practica` y `Enfermero ↔ Zona`.
- **Búsquedas:** enfermeros verificados por zona y práctica; solicitudes por estado/zona; cobertura por zona.
- **Máquina de estados** de la solicitud, validada en el backend.

## 4. Arquitectura

```
                 ┌──────────────────────────────┐
  React (Vite) ─►│ api-gateway (NestJS)          │  REST + Swagger (/api/docs)
                 │ GraphQL (/graphql)            │  JWT + RolesGuard, Throttler, Helmet
                 └──────┬───────────────┬────────┘
                   TCP  │               │ TCP   (@nestjs/microservices)
            ┌───────────▼───┐     ┌─────▼──────────────┐
            │ auth-service  │     │ cuidados-service    │
            │ usuarios,     │     │ prácticas, zonas,   │
            │ perfiles enf. │     │ solicitudes, visitas,│
            └───────┬───────┘     │ reseñas, estadísticas│
                    │             └─────┬──────────────┘
                    └──── MongoDB ──────┘  (una BD por servicio: auth_db, cuidados_db)
```

- **GraphQL (2 CRUD):** `Practica` y `Solicitud`.
- **REST:** `/auth` (registro/login/me), `/enfermeros` (perfil, búsqueda, verificación), `/zonas`,
  `/solicitudes/:id/visitas`, `/resenas`, `/estadisticas/cobertura`.
- El **gateway** es el único expuesto al frontend; los microservicios solo dentro de la red Docker.

## 5. Estructura del repo

```
/
├── api-gateway/          NestJS (REST + GraphQL + Swagger)
├── auth-service/         NestJS microservicio TCP + Mongoose
├── cuidados-service/     NestJS microservicio TCP + Mongoose
├── frontend/             React + Vite + TypeScript
├── seed/                 script de inicialización de la BD (datos de prueba)
├── docs/                 documento de la problemática, arquitectura, guía de exposición
├── docker-compose.yml
├── .env.example
└── README.md
```

## 6. Docker (aislado de otros proyectos)

- `name:` propio en compose → contenedores, red y volúmenes con prefijo exclusivo.
- Puertos de host poco comunes: frontend `5180`, gateway `3100`, Mongo `27030` (solo para inspección).
- Servicios internos (auth/cuidados) **sin puertos publicados**.
- Un solo comando: `docker compose up --build` (+ servicio `seed` que carga datos de prueba).

## 7. Testing

| Dónde | Test |
|---|---|
| auth-service (unit) | Creación válida de usuario / validación de entidad |
| auth-service (unit) | Error al registrar email duplicado |
| auth-service (unit) | Relación M:N enfermero ↔ prácticas/zonas |
| cuidados-service (unit) | Transiciones válidas/ inválidas de estado de solicitud |
| api-gateway (e2e) | Registro → login → crear solicitud |
| api-gateway (e2e) | CRUD GraphQL de Práctica con rol ADMIN (y rechazo sin rol) |
| frontend (Vitest + RTL) | Login, ruta protegida, componentes reutilizables |

Los tests de backend usan `mongodb-memory-server` → no requieren Docker para correr.

## 8. Fases

1. **Base:** git, estructura, `.gitignore`, `.env.example`, docker-compose.
2. **auth-service:** usuarios, hash bcrypt, JWT, perfiles de enfermero, verificación.
3. **cuidados-service:** prácticas, zonas, solicitudes (estados), visitas, reseñas, estadísticas.
4. **api-gateway:** REST + Swagger, GraphQL, guards de auth/roles, filtro de errores, logging.
5. **seed:** datos de prueba (usuarios por rol, prácticas, zonas de Mendoza, solicitudes).
6. **frontend:** login/registro, rutas protegidas por rol, paneles de admin/enfermero/paciente.
7. **tests** backend + frontend.
8. **documentación:** README, documento de problemática, diagrama, guía para exponer.
9. **Verificación final:** clonar limpio → `docker compose up --build` → recorrido completo.

## 9. Fuera de alcance (trabajo futuro)

Pagos, chat en tiempo real, mapas/geolocalización, validación automática de matrículas con el colegio.
