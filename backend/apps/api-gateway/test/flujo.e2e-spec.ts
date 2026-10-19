import { levantarSistema, Sistema } from './entorno-e2e';

const CREAR_SOLICITUD = /* GraphQL */ `
  mutation Crear($input: CrearSolicitudInput!) {
    crearSolicitud(input: $input) {
      id
      estado
      origen
      pacienteNombre
      zona {
        nombre
      }
      practicas {
        nombre
      }
    }
  }
`;

const LISTAR_SOLICITUDES = /* GraphQL */ `
  query Listar($filtro: FiltroSolicitudesInput) {
    solicitudes(filtro: $filtro) {
      id
      estado
      pacienteNombre
    }
  }
`;

const CREAR_PRACTICA = /* GraphQL */ `
  mutation Crear($input: CrearPracticaInput!) {
    crearPractica(input: $input) {
      id
      nombre
      duracionEstimadaMin
      activa
    }
  }
`;

describe('Cuidá+ (e2e: gateway + microservicios + MongoDB)', () => {
  let sistema: Sistema;
  let tokenAdmin: string;
  let zonaId: string;
  let practicaId: string;

  beforeAll(async () => {
    sistema = await levantarSistema();
    await sistema.crearAdmin('admin@cuidamas.com', 'Admin1234');
    tokenAdmin = await sistema.login('admin@cuidamas.com', 'Admin1234');

    const zona = await sistema
      .http()
      .post('/api/zonas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Villa Nueva', departamento: 'Guaymallén' })
      .expect(201);
    zonaId = zona.body.id;

    const { data } = await sistema.graphql(
      CREAR_PRACTICA,
      { input: { nombre: 'Curación', duracionEstimadaMin: 30 } },
      tokenAdmin,
    );
    practicaId = data!.crearPractica.id;
  });

  afterAll(() => sistema.cerrar());

  it('flujo completo: registro → login → crear solicitud (GraphQL) → verla en el listado', async () => {
    // 1. Registro público de un paciente
    const registro = await sistema
      .http()
      .post('/api/auth/registro')
      .send({
        email: 'rosa@mail.com',
        password: 'Paciente123',
        nombre: 'Rosa',
        apellido: 'López',
        dni: '25111222',
      })
      .expect(201);
    expect(registro.body).toMatchObject({
      email: 'rosa@mail.com',
      rol: 'PACIENTE',
    });
    expect(registro.body.passwordHash).toBeUndefined();

    // El email es único: un segundo registro falla con 409.
    await sistema
      .http()
      .post('/api/auth/registro')
      .send({
        email: 'ROSA@mail.com',
        password: 'Paciente123',
        nombre: 'Otra',
        apellido: 'Persona',
        dni: '25999888',
      })
      .expect(409);

    // 2. Login: contraseña incorrecta → 401; correcta → token
    await sistema
      .http()
      .post('/api/auth/login')
      .send({ email: 'rosa@mail.com', password: 'incorrecta' })
      .expect(401);
    const token = await sistema.login('rosa@mail.com', 'Paciente123');

    const perfil = await sistema
      .http()
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(perfil.body.nombre).toBe('Rosa');

    // 3. Crear el recurso (solicitud de cuidados) por GraphQL
    const creada = await sistema.graphql(
      CREAR_SOLICITUD,
      {
        input: {
          zonaId,
          practicaIds: [practicaId],
          direccion: 'Calle Falsa 123',
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-10',
          frecuencia: 'Diaria',
        },
      },
      token,
    );
    expect(creada.errors).toBeUndefined();
    expect(creada.data!.crearSolicitud).toMatchObject({
      estado: 'PENDIENTE',
      origen: 'PARTICULAR',
      pacienteNombre: 'Rosa López',
      zona: { nombre: 'Villa Nueva' },
      practicas: [{ nombre: 'Curación' }],
    });

    // 4. El paciente la ve en su listado
    const listado = await sistema.graphql(LISTAR_SOLICITUDES, {}, token);
    expect(listado.data!.solicitudes).toHaveLength(1);
    expect(listado.data!.solicitudes[0].id).toBe(
      creada.data!.crearSolicitud.id,
    );

    // Datos inválidos: la validación del gateway responde 400 con mensajes claros.
    const invalida = await sistema.graphql(
      CREAR_SOLICITUD,
      {
        input: {
          zonaId: 'no-es-un-id',
          practicaIds: [],
          direccion: '',
          fechaInicio: 'ayer',
          fechaFin: '2026-11-10',
          frecuencia: 'Diaria',
        },
      },
      token,
    );
    expect(invalida.errors![0].extensions.status).toBe(400);
  });

  it('CRUD GraphQL de prácticas protegido por autenticación y roles', async () => {
    // Sin token → 401
    const sinToken = await sistema.graphql('{ practicas { id } }');
    expect(sinToken.errors![0].extensions.status).toBe(401);

    // Un paciente puede leer pero no crear → 403
    await sistema
      .http()
      .post('/api/auth/registro')
      .send({
        email: 'juan@mail.com',
        password: 'Paciente123',
        nombre: 'Juan',
        apellido: 'Díaz',
        dni: '26111222',
      })
      .expect(201);
    const tokenPaciente = await sistema.login('juan@mail.com', 'Paciente123');
    const lectura = await sistema.graphql(
      '{ practicas { nombre } }',
      {},
      tokenPaciente,
    );
    expect(lectura.data!.practicas.length).toBeGreaterThan(0);
    const prohibido = await sistema.graphql(
      CREAR_PRACTICA,
      { input: { nombre: 'Inyectable', duracionEstimadaMin: 15 } },
      tokenPaciente,
    );
    expect(prohibido.errors![0].extensions.status).toBe(403);

    // ADMIN: Create
    const creada = await sistema.graphql(
      CREAR_PRACTICA,
      { input: { nombre: 'Inyectable', duracionEstimadaMin: 15 } },
      tokenAdmin,
    );
    const id = creada.data!.crearPractica.id as string;
    expect(creada.data!.crearPractica).toMatchObject({
      nombre: 'Inyectable',
      activa: true,
    });

    // Nombre duplicado → 409
    const duplicada = await sistema.graphql(
      CREAR_PRACTICA,
      { input: { nombre: 'Inyectable', duracionEstimadaMin: 20 } },
      tokenAdmin,
    );
    expect(duplicada.errors![0].extensions.status).toBe(409);

    // Read
    const leida = await sistema.graphql(
      'query ($id: ID!) { practica(id: $id) { nombre } }',
      { id },
      tokenAdmin,
    );
    expect(leida.data!.practica.nombre).toBe('Inyectable');

    // Update
    const actualizada = await sistema.graphql(
      `mutation ($id: ID!, $input: ActualizarPracticaInput!) {
        actualizarPractica(id: $id, input: $input) { duracionEstimadaMin activa }
      }`,
      { id, input: { duracionEstimadaMin: 20, activa: false } },
      tokenAdmin,
    );
    expect(actualizada.data!.actualizarPractica).toEqual({
      duracionEstimadaMin: 20,
      activa: false,
    });

    // Delete
    await sistema.graphql(
      'mutation ($id: ID!) { eliminarPractica(id: $id) { id } }',
      { id },
      tokenAdmin,
    );
    const borrada = await sistema.graphql(
      'query ($id: ID!) { practica(id: $id) { id } }',
      { id },
      tokenAdmin,
    );
    expect(borrada.errors![0].extensions.status).toBe(404);
  });

  it('flujo del enfermero: perfil → verificación → aceptar → visita → finalizar → reseña', async () => {
    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    // Paciente pide cuidados
    await sistema
      .http()
      .post('/api/auth/registro')
      .send({
        email: 'marta@mail.com',
        password: 'Paciente123',
        nombre: 'Marta',
        apellido: 'Sosa',
        dni: '27111222',
      })
      .expect(201);
    const tokenPaciente = await sistema.login('marta@mail.com', 'Paciente123');
    const { data } = await sistema.graphql(
      CREAR_SOLICITUD,
      {
        input: {
          zonaId,
          practicaIds: [practicaId],
          direccion: 'San Martín 500',
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-05',
          frecuencia: 'Diaria',
        },
      },
      tokenPaciente,
    );
    const solicitudId = data!.crearSolicitud.id as string;

    // Enfermera se registra y completa su perfil
    await sistema
      .http()
      .post('/api/auth/registro')
      .send({
        email: 'laura@mail.com',
        password: 'Enfermera123',
        nombre: 'Laura',
        apellido: 'Gómez',
        dni: '28111222',
        rol: 'ENFERMERO',
      })
      .expect(201);
    const tokenEnf = await sistema.login('laura@mail.com', 'Enfermera123');
    const perfil = await sistema
      .http()
      .put('/api/enfermeros/mi-perfil')
      .set(auth(tokenEnf))
      .send({
        matricula: 'MP-777',
        zonaIds: [zonaId],
        practicaIds: [practicaId],
      })
      .expect(200);
    expect(perfil.body.verificado).toBe(false);

    // Sin verificar no puede aceptar
    await sistema
      .http()
      .post(`/api/solicitudes/${solicitudId}/aceptar`)
      .set(auth(tokenEnf))
      .expect(403);

    // El centro verifica la matrícula; un paciente no puede hacerlo
    await sistema
      .http()
      .patch(`/api/enfermeros/${perfil.body.id}/verificacion`)
      .set(auth(tokenPaciente))
      .send({ verificado: true })
      .expect(403);
    await sistema
      .http()
      .patch(`/api/enfermeros/${perfil.body.id}/verificacion`)
      .set(auth(tokenAdmin))
      .send({ verificado: true })
      .expect(200);

    const disponibles = await sistema.graphql(
      LISTAR_SOLICITUDES,
      { filtro: { vista: 'disponibles' } },
      tokenEnf,
    );
    expect(
      disponibles.data!.solicitudes.map((s: { id: string }) => s.id),
    ).toContain(solicitudId);

    await sistema
      .http()
      .post(`/api/solicitudes/${solicitudId}/aceptar`)
      .set(auth(tokenEnf))
      .expect(200);
    await sistema
      .http()
      .post(`/api/solicitudes/${solicitudId}/visitas`)
      .set(auth(tokenEnf))
      .send({
        observaciones: 'Curación realizada, buena evolución',
        practicaIds: [practicaId],
        temperatura: 36.5,
      })
      .expect(201);

    const bitacora = await sistema
      .http()
      .get(`/api/solicitudes/${solicitudId}/visitas`)
      .set(auth(tokenPaciente))
      .expect(200);
    expect(bitacora.body).toHaveLength(1);

    await sistema
      .http()
      .post(`/api/solicitudes/${solicitudId}/finalizar`)
      .set(auth(tokenEnf))
      .expect(200);
    await sistema
      .http()
      .post(`/api/solicitudes/${solicitudId}/resena`)
      .set(auth(tokenPaciente))
      .send({ puntaje: 5, comentario: 'Excelente' })
      .expect(201);

    const cobertura = await sistema
      .http()
      .get('/api/estadisticas/cobertura')
      .set(auth(tokenAdmin))
      .expect(200);
    expect(cobertura.body[0]).toHaveProperty('nivel');
  });
});
