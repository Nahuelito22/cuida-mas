import { EstadoSolicitud, OrigenSolicitud, Rol } from '@app/common';
import { SolicitudesService } from './solicitudes.service';
import { VisitasService } from './visitas.service';
import { ResenasService } from './resenas.service';
import { EnfermerosService } from '../enfermeros/enfermeros.service';
import { EstadisticasService } from '../estadisticas/estadisticas.service';
import { PracticasService } from '../practicas/practicas.service';
import { ZonasService } from '../zonas/zonas.service';
import {
  crearModuloDePrueba,
  errorDe,
  usuario,
} from '../../test/mongo-de-prueba';

describe('SolicitudesService - flujo del plan de cuidados (unit)', () => {
  let entorno: Awaited<ReturnType<typeof crearModuloDePrueba>>;
  let solicitudes: SolicitudesService;
  let visitas: VisitasService;
  let resenas: ResenasService;
  let enfermeros: EnfermerosService;
  let estadisticas: EstadisticasService;

  const paciente = usuario(Rol.PACIENTE, 'usuario-pac-1', 'Rosa', 'López');
  const otroPaciente = usuario(Rol.PACIENTE, 'usuario-pac-2');
  const enfermera = usuario(Rol.ENFERMERO, 'usuario-enf-1', 'Laura', 'Gómez');
  const admin = usuario(Rol.ADMIN, 'usuario-admin');

  let ids: {
    curacion: string;
    inyectable: string;
    zona: string;
    otraZona: string;
  };

  beforeAll(async () => {
    entorno = await crearModuloDePrueba();
    const get = entorno.moduleRef.get.bind(entorno.moduleRef);
    solicitudes = get(SolicitudesService);
    visitas = get(VisitasService);
    resenas = get(ResenasService);
    enfermeros = get(EnfermerosService);
    estadisticas = get(EstadisticasService);
  });

  beforeEach(async () => {
    const practicas = entorno.moduleRef.get(PracticasService);
    const zonas = entorno.moduleRef.get(ZonasService);
    const [curacion, inyectable, zona, otraZona] = await Promise.all([
      practicas.crear({ nombre: 'Curación', duracionEstimadaMin: 30 }),
      practicas.crear({ nombre: 'Inyectable', duracionEstimadaMin: 15 }),
      zonas.crear({ nombre: 'Villa Nueva', departamento: 'Guaymallén' }),
      zonas.crear({ nombre: 'Costa de Araujo', departamento: 'Lavalle' }),
    ]);
    ids = {
      curacion: curacion.id,
      inyectable: inyectable.id,
      zona: zona.id,
      otraZona: otraZona.id,
    };
  });

  afterEach(() => entorno.limpiar());
  afterAll(() => entorno.cerrar());

  function crearSolicitud(practicaIds = [ids.curacion]) {
    return solicitudes.crear(paciente, {
      zonaId: ids.zona,
      practicaIds,
      direccion: 'Calle Falsa 123',
      fechaInicio: '2026-11-01',
      fechaFin: '2026-11-10',
      frecuencia: 'Diaria',
    });
  }

  async function perfilEnfermera(
    verificado: boolean,
    practicaIds = [ids.curacion],
  ) {
    const perfil = await enfermeros.guardarPerfil(enfermera, {
      matricula: 'MP-100',
      practicaIds,
      zonaIds: [ids.zona],
    });
    if (verificado) await enfermeros.verificar(perfil.id, true);
    return perfil;
  }

  it('el paciente crea una solicitud particular en estado PENDIENTE', async () => {
    const solicitud = await crearSolicitud();
    expect(solicitud.estado).toBe(EstadoSolicitud.PENDIENTE);
    expect(solicitud.origen).toBe(OrigenSolicitud.PARTICULAR);
    expect(solicitud.pacienteNombre).toBe('Rosa López');
  });

  it('valida fechas y que el enfermero no pueda crear solicitudes', async () => {
    const fechas = await errorDe(
      solicitudes.crear(paciente, {
        zonaId: ids.zona,
        practicaIds: [ids.curacion],
        direccion: 'X',
        fechaInicio: '2026-11-10',
        fechaFin: '2026-11-01',
        frecuencia: 'Diaria',
      }),
    );
    expect(fechas.statusCode).toBe(400);

    const rol = await errorDe(
      solicitudes.crear(enfermera, {
        zonaId: ids.zona,
        practicaIds: [ids.curacion],
        direccion: 'X',
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-02',
        frecuencia: 'Diaria',
      }),
    );
    expect(rol.statusCode).toBe(403);
  });

  it('cada paciente ve solo sus solicitudes', async () => {
    await crearSolicitud();
    expect(await solicitudes.listar(paciente)).toHaveLength(1);
    expect(await solicitudes.listar(otroPaciente)).toHaveLength(0);
    expect(await solicitudes.listar(admin)).toHaveLength(1);
  });

  it('solo los enfermeros verificados y compatibles ven y aceptan solicitudes', async () => {
    const solicitud = await crearSolicitud([ids.curacion, ids.inyectable]);

    // Sin verificar: no ve nada y no puede aceptar.
    await perfilEnfermera(false, [ids.curacion, ids.inyectable]);
    expect(
      await solicitudes.listar(enfermera, { vista: 'disponibles' }),
    ).toHaveLength(0);
    expect(
      (await errorDe(solicitudes.aceptar(enfermera, solicitud.id))).statusCode,
    ).toBe(403);

    // Verificado pero sin una de las prácticas: tampoco es compatible.
    await perfilEnfermera(true, [ids.curacion]);
    expect(
      await solicitudes.listar(enfermera, { vista: 'disponibles' }),
    ).toHaveLength(0);

    // Verificado y con todas las prácticas: la ve y la acepta.
    await perfilEnfermera(true, [ids.curacion, ids.inyectable]);
    expect(
      await solicitudes.listar(enfermera, { vista: 'disponibles' }),
    ).toHaveLength(1);
    const aceptada = await solicitudes.aceptar(enfermera, solicitud.id);
    expect(aceptada.estado).toBe(EstadoSolicitud.ACEPTADA);

    // No se puede aceptar dos veces.
    expect(
      (await errorDe(solicitudes.aceptar(enfermera, solicitud.id))).statusCode,
    ).toBe(409);
  });

  it('recorre el flujo completo: aceptar → visita (EN_CURSO) → finalizar → reseña', async () => {
    const solicitud = await crearSolicitud();
    await perfilEnfermera(true);
    await solicitudes.aceptar(enfermera, solicitud.id);

    // Una visita con una práctica fuera del plan se rechaza.
    const fueraDelPlan = await errorDe(
      visitas.registrar(enfermera, solicitud.id, {
        observaciones: 'Control',
        practicaIds: [ids.inyectable],
      }),
    );
    expect(fueraDelPlan.statusCode).toBe(400);

    await visitas.registrar(enfermera, solicitud.id, {
      observaciones: 'Herida limpia, sin signos de infección',
      practicaIds: [ids.curacion],
      presionArterial: '120/80',
    });
    const enCurso = await solicitudes.obtener(paciente, solicitud.id);
    expect(enCurso.estado).toBe(EstadoSolicitud.EN_CURSO);
    expect(await visitas.listar(paciente, solicitud.id)).toHaveLength(1);

    // Otro paciente no puede ver la bitácora.
    expect(
      (await errorDe(visitas.listar(otroPaciente, solicitud.id))).statusCode,
    ).toBe(403);

    const finalizada = await solicitudes.finalizar(enfermera, solicitud.id);
    expect(finalizada.estado).toBe(EstadoSolicitud.FINALIZADA);

    await resenas.crear(paciente, solicitud.id, { puntaje: 4 });
    const perfil = await enfermeros.miPerfil(enfermera.id);
    expect(perfil.puntajePromedio).toBe(4);
    expect(perfil.cantidadResenas).toBe(1);

    // Una sola reseña por solicitud.
    expect(
      (await errorDe(resenas.crear(paciente, solicitud.id, { puntaje: 5 })))
        .statusCode,
    ).toBe(409);
  });

  it('respeta la máquina de estados (no se cancela algo finalizado ni se edita algo aceptado)', async () => {
    const solicitud = await crearSolicitud();
    await perfilEnfermera(true);
    await solicitudes.aceptar(enfermera, solicitud.id);

    const editar = await errorDe(
      solicitudes.actualizar(paciente, solicitud.id, { direccion: 'Otra' }),
    );
    expect(editar.statusCode).toBe(409);

    const finalizarSinVisitas = await errorDe(
      solicitudes.finalizar(enfermera, solicitud.id),
    );
    expect(finalizarSinVisitas.statusCode).toBe(409);

    const cancelada = await solicitudes.cancelar(
      paciente,
      solicitud.id,
      'Reinternación',
    );
    expect(cancelada.estado).toBe(EstadoSolicitud.CANCELADA);
    expect(
      (await errorDe(solicitudes.cancelar(paciente, solicitud.id))).statusCode,
    ).toBe(409);
  });

  it('calcula la cobertura por zona (demanda vs. enfermeros verificados)', async () => {
    await crearSolicitud();
    await crearSolicitud();

    let cobertura = await estadisticas.coberturaPorZona();
    const zona = () => cobertura.find((z) => z.zonaId === ids.zona)!;
    expect(zona()).toMatchObject({
      pendientes: 2,
      enfermerosVerificados: 0,
      nivel: 'CRITICA',
    });
    expect(cobertura.find((z) => z.zonaId === ids.otraZona)!.nivel).toBe(
      'SIN_DEMANDA',
    );

    await perfilEnfermera(true);
    cobertura = await estadisticas.coberturaPorZona();
    expect(zona()).toMatchObject({
      enfermerosVerificados: 1,
      nivel: 'ADECUADA',
    });
  });
});
