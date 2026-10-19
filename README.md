# Cuidá+ — Red de enfermería domiciliaria con continuidad post-alta

> Trabajo Práctico Integrador · **Programación III** · IES 9-023 · 2026
> Desarrollo Fullstack con **NestJS (microservicios) + ReactJS + MongoDB + GraphQL + Docker**

## Integrantes

| Nombre | GitHub |
|---|---|
| _Completar_ | _@usuario_ |
| _Completar_ | _@usuario_ |

---

## La problemática

Cuando un paciente recibe el alta (de un hospital o de un centro de salud) y necesita cuidados de
enfermería en su casa —curaciones, inyectables, control de presión, cambio de sonda—, **el seguimiento
se corta**:

- La familia busca enfermeros "de boca en boca", sin garantía de que estén matriculados.
- El centro que dio el alta **no se entera** de cómo evoluciona el paciente.
- Hay **zonas con poca oferta de enfermería** (departamentos alejados) y nadie lo mide.

## La solución

**Cuidá+** conecta a tres actores:

| Actor | Qué hace en el sistema |
|---|---|
| 🏥 **Centro de salud** (`ADMIN`) | Deriva pacientes al dar el alta con un *plan de cuidados*, verifica matrículas, administra el catálogo y ve la **cobertura por zona** |
| 🩺 **Enfermero/a** (`ENFERMERO`) | Carga su perfil (matrícula, zonas, prácticas), acepta solicitudes compatibles y registra cada visita en la **bitácora** |
| 🧑 **Paciente o familiar** (`PACIENTE`) | Pide cuidados, sigue la bitácora, cancela si hace falta y califica al terminar |

Flujo de una solicitud:

```
PENDIENTE ──aceptar──► ACEPTADA ──1ra visita──► EN_CURSO ──finalizar──► FINALIZADA ──► reseña
    │                      │
    └──────cancelar────────┴──► CANCELADA
```

Más detalle en [`docs/documento-problematica.md`](docs/documento-problematica.md).

---

## Cómo levantar el proyecto

### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con Docker Compose v2)
- Nada más: Node y MongoDB corren dentro de los contenedores.

### 1. Clonar y levantar

```bash
git clone <url-del-repo>
cd Tp_Integrador_Programacion_3
docker compose up --build
```

La primera vez tarda unos minutos (descarga imágenes y compila). Al terminar:

| Servicio | URL |
|---|---|
| **Aplicación web** | http://localhost:5180 |
| **Swagger (REST)** | http://localhost:3100/api/docs |
| **GraphQL (explorador)** | http://localhost:3100/graphql |
| MongoDB (Compass, opcional) | `mongodb://localhost:27030` |

> Los puertos se pueden cambiar copiando `.env.example` a `.env`. Están elegidos para no chocar
> con otros proyectos, y el proyecto de compose se llama `cuida-mas`, así que sus contenedores,
> red y volumen no se mezclan con los de otros proyectos.

### 2. Usuarios de prueba (los carga el seed automáticamente)

| Rol | Email | Contraseña |
|---|---|---|
| Centro de salud | `admin@cuidamas.com` | `Admin1234` |
| Paciente | `paciente@cuidamas.com` | `Paciente123` |
| Enfermera (verificada) | `enfermera@cuidamas.com` | `Enfermera123` |
| Enfermero (sin verificar) | `diego.molina@mail.com` | `Enfermero123` |

### Comandos útiles

```bash
docker compose up --build -d        # levantar en segundo plano
docker compose logs -f api-gateway  # ver logs de un servicio
docker compose down                 # apagar (los datos se conservan)
docker compose down -v              # apagar y BORRAR la base de datos
docker compose run --rm seed node scripts/seed.js --reset   # recargar datos de demo
```

---

## Arquitectura

```
                       ┌──────────────────────────────┐
   Navegador ──► nginx │ frontend (React + Vite)       │ :5180
                       └──────────────┬───────────────┘
                          /api, /graphql (proxy)
                       ┌──────────────▼───────────────┐
                       │ api-gateway (NestJS)          │ :3100
                       │ REST + Swagger · GraphQL      │
                       │ JWT · roles · rate limit      │
                       └──────┬────────────────┬──────┘
                         TCP  │                │  TCP
               ┌──────────────▼─────┐  ┌───────▼──────────────┐
               │ auth-service       │  │ cuidados-service      │
               │ usuarios, login,   │  │ prácticas, zonas,     │
               │ emisión de JWT     │  │ enfermeros, solicitu- │
               └─────────┬──────────┘  │ des, visitas, reseñas,│
                         │             │ estadísticas          │
                         │             └───────┬──────────────┘
                     cuidamas_auth      cuidamas_cuidados
                         └────── MongoDB ──────┘
```

- **3 servicios NestJS** en un monorepo (`backend/apps/*`) que comparten contratos en `backend/libs/common`.
  Cada uno corre en **su propio contenedor**.
- **Cada microservicio tiene su propia base de datos** (`cuidamas_auth` y `cuidamas_cuidados`).
- Los microservicios **no se exponen**: solo el gateway es accesible desde afuera.

Explicación completa, endpoints y decisiones en [`docs/arquitectura.md`](docs/arquitectura.md).

### Cumplimiento de la consigna

| Requisito | Dónde está |
|---|---|
| Microservicios (≥2) | `auth-service` y `cuidados-service` (TCP), orquestados por `api-gateway` |
| Endpoints RESTful | `/api/auth`, `/api/usuarios`, `/api/zonas`, `/api/enfermeros`, `/api/solicitudes/:id/...`, `/api/estadisticas` |
| **Dos CRUD GraphQL** | `Practica` (catálogo) y `Solicitud` (planes de cuidado) en `/graphql` |
| MongoDB | Mongoose, una base por microservicio |
| Documentación de API | Swagger en `/api/docs` + schema GraphQL autodocumentado |
| Frontend React con componentes reutilizables | `frontend/src/components` (Tabla, Modal, Campos, Tarjeta, Insignias, etc.) |
| Sección protegida con autenticación | `/app/*` con JWT y control por rol (`RutaProtegida`) |
| Docker + docker-compose | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |
| 2 unit + 2 e2e en backend | 27 unit + 3 e2e (ver abajo) |
| Tests en frontend | 16 tests con Vitest + React Testing Library |
| Script de inicialización de BD | `backend/scripts/seed.js` (se ejecuta solo al levantar) |
| Roles, relaciones, búsquedas | 3 roles · relaciones M:N Enfermero↔Práctica y Enfermero↔Zona · búsquedas por zona/práctica/texto/estado |

---

## Tests

Los tests del backend usan **MongoDB en memoria** (`mongodb-memory-server`), así que **no necesitan Docker**.

```bash
# Backend
cd backend
npm install
npm test            # 27 tests unitarios
npm run test:e2e    # 3 tests end-to-end (levantan gateway + 2 microservicios + Mongo en memoria)

# Frontend
cd frontend
npm install
npm test            # 16 tests (Vitest + React Testing Library)
```

| Caso sugerido por la consigna | Test |
|---|---|
| Unit: validación de creación de entidades | `auth-service/.../usuarios.service.spec.ts` |
| Unit: error al duplicar datos únicos (email) | `auth-service/.../usuarios.service.spec.ts` |
| Unit: validación de relación muchos-a-muchos | `cuidados-service/.../enfermeros.service.spec.ts` |
| Integration: registro → login → crear recurso | `api-gateway/test/flujo.e2e-spec.ts` |

Extra: máquina de estados, flujo completo enfermero→reseña, cobertura por zona, CRUD GraphQL con permisos.

---

## Desarrollo local sin Docker (opcional)

Necesita Node 22+ y un MongoDB accesible (por ejemplo, solo el contenedor de Mongo:
`docker compose up -d mongo`).

```bash
cd backend && npm install
cp ../.env.example .env    # agregar JWT_SECRET=algo
npm run seed
npm run start:auth         # terminal 1
npm run start:cuidados     # terminal 2
npm run start:gateway      # terminal 3 (puerto 3000)

cd frontend && npm install
VITE_GATEWAY_URL=http://localhost:3000 npm run dev   # http://localhost:5173
```

---

## Decisiones de diseño

- **API Gateway como única puerta de entrada**: centraliza autenticación, autorización por rol, validación,
  rate limiting y documentación. Los microservicios confían en el usuario que les pasa el gateway.
- **TCP entre servicios** (`@nestjs/microservices`): simple, sin infraestructura extra (no hace falta RabbitMQ/Kafka).
- **Monorepo de Nest**: los tres servicios comparten `libs/common` (patrones de mensajes, enums, errores),
  así emisor y receptor nunca quedan desincronizados. Cada uno se despliega en su contenedor.
- **Base de datos por servicio**: `cuidados-service` guarda el `usuarioId`/`pacienteNombre` como copia
  (no puede hacer `populate` contra otra base). El gateway combina datos de ambos cuando hace falta
  (ej.: al derivar valida al paciente en `auth-service`).
- **CRUD en GraphQL, flujo en REST**: crear/leer/editar/borrar prácticas y solicitudes va por GraphQL;
  las *acciones* que cambian el estado (aceptar, cancelar, visitar, finalizar, calificar) son endpoints REST.
- **Reglas de negocio en el backend**: la máquina de estados, quién puede ver qué, la compatibilidad
  enfermero↔solicitud y la aceptación atómica (dos enfermeros no pueden tomar la misma solicitud).
- **Seguridad**: contraseñas con bcrypt, JWT con vencimiento, `helmet`, CORS restringido, rate limit
  (más estricto en login), validación con `whitelist` + `forbidNonWhitelisted`, mensajes de login que no
  revelan si el email existe, contenedores que no corren como root, CSP en nginx.
- **Logging**: el gateway registra cada request (método/operación GraphQL, usuario, estado, duración) y
  cada microservicio registra cada mensaje TCP recibido.

Fuera de alcance (trabajo futuro): pagos, chat en tiempo real, mapas con geolocalización y validación
automática de matrículas contra el colegio profesional.
