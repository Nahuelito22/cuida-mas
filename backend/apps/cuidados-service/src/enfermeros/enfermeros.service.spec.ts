import { Rol } from '@app/common';
import { EnfermerosService } from './enfermeros.service';
import { PracticasService } from '../practicas/practicas.service';
import { ZonasService } from '../zonas/zonas.service';
import {
  crearModuloDePrueba,
  errorDe,
  usuario,
} from '../../test/mongo-de-prueba';

describe('EnfermerosService - relación muchos-a-muchos (unit)', () => {
  let entorno: Awaited<ReturnType<typeof crearModuloDePrueba>>;
  let enfermeros: EnfermerosService;
  let practicas: PracticasService;
  let zonas: ZonasService;

  const enfermera = usuario(Rol.ENFERMERO, 'usuario-enf-1', 'Laura', 'Gómez');
  const enfermero2 = usuario(Rol.ENFERMERO, 'usuario-enf-2', 'Pedro', 'Ruiz');

  beforeAll(async () => {
    entorno = await crearModuloDePrueba();
    enfermeros = entorno.moduleRef.get(EnfermerosService);
    practicas = entorno.moduleRef.get(PracticasService);
    zonas = entorno.moduleRef.get(ZonasService);
  });
  afterEach(() => entorno.limpiar());
  afterAll(() => entorno.cerrar());

  async function catalogo() {
    const [curacion, inyectable, sonda] = await Promise.all([
      practicas.crear({ nombre: 'Curación', duracionEstimadaMin: 30 }),
      practicas.crear({ nombre: 'Inyectable', duracionEstimadaMin: 15 }),
      practicas.crear({ nombre: 'Cambio de sonda', duracionEstimadaMin: 40 }),
    ]);
    const [centro, lasHeras] = await Promise.all([
      zonas.crear({ nombre: 'Ciudad - 4ta Sección', departamento: 'Capital' }),
      zonas.crear({ nombre: 'El Algarrobal', departamento: 'Las Heras' }),
    ]);
    return { curacion, inyectable, sonda, centro, lasHeras };
  }

  it('un enfermero se vincula con muchas prácticas y zonas, y se devuelven completas', async () => {
    const c = await catalogo();

    const perfil = await enfermeros.guardarPerfil(enfermera, {
      matricula: 'mp-1234',
      // El id repetido no debe duplicar la relación.
      practicaIds: [c.curacion.id, c.inyectable.id, c.curacion.id],
      zonaIds: [c.centro.id, c.lasHeras.id],
    });

    expect(perfil.matricula).toBe('MP-1234');
    expect(perfil.verificado).toBe(false);
    const json = perfil.toJSON() as unknown as {
      practicas: { nombre: string }[];
      zonas: { nombre: string }[];
    };
    expect(json.practicas.map((p) => p.nombre).sort()).toEqual([
      'Curación',
      'Inyectable',
    ]);
    expect(json.zonas).toHaveLength(2);
  });

  it('una práctica la realizan muchos enfermeros: la búsqueda funciona desde ambos lados', async () => {
    const c = await catalogo();
    await enfermeros.guardarPerfil(enfermera, {
      matricula: 'MP-1',
      practicaIds: [c.curacion.id, c.inyectable.id],
      zonaIds: [c.centro.id],
    });
    await enfermeros.guardarPerfil(enfermero2, {
      matricula: 'MP-2',
      practicaIds: [c.curacion.id, c.sonda.id],
      zonaIds: [c.lasHeras.id],
    });

    const hacenCuraciones = await enfermeros.buscar({
      practicaId: c.curacion.id,
    });
    expect(hacenCuraciones.map((e) => e.nombre).sort()).toEqual([
      'Laura',
      'Pedro',
    ]);

    const hacenSonda = await enfermeros.buscar({ practicaId: c.sonda.id });
    expect(hacenSonda.map((e) => e.nombre)).toEqual(['Pedro']);

    const enLasHerasConCuracion = await enfermeros.buscar({
      zonaId: c.lasHeras.id,
      practicaId: c.curacion.id,
    });
    expect(enLasHerasConCuracion.map((e) => e.nombre)).toEqual(['Pedro']);
  });

  it('rechaza vincular prácticas que no existen o están inactivas', async () => {
    const c = await catalogo();
    await practicas.actualizar(c.sonda.id, { activa: false });

    const inexistente = await errorDe(
      enfermeros.guardarPerfil(enfermera, {
        matricula: 'MP-1',
        practicaIds: ['64b000000000000000000000'],
        zonaIds: [c.centro.id],
      }),
    );
    expect(inexistente.statusCode).toBe(400);

    const inactiva = await errorDe(
      enfermeros.guardarPerfil(enfermera, {
        matricula: 'MP-1',
        practicaIds: [c.sonda.id],
        zonaIds: [c.centro.id],
      }),
    );
    expect(inactiva.statusCode).toBe(400);
  });

  it('no permite borrar una práctica vinculada a un enfermero', async () => {
    const c = await catalogo();
    await enfermeros.guardarPerfil(enfermera, {
      matricula: 'MP-1',
      practicaIds: [c.curacion.id],
      zonaIds: [c.centro.id],
    });

    const error = await errorDe(practicas.eliminar(c.curacion.id));
    expect(error.statusCode).toBe(409);
    await expect(practicas.eliminar(c.sonda.id)).resolves.toBeDefined();
  });

  it('si cambia la matrícula, el perfil vuelve a quedar sin verificar', async () => {
    const c = await catalogo();
    const perfil = await enfermeros.guardarPerfil(enfermera, {
      matricula: 'MP-1',
      practicaIds: [c.curacion.id],
      zonaIds: [c.centro.id],
    });
    await enfermeros.verificar(perfil.id, true);

    const mismaMatricula = await enfermeros.guardarPerfil(enfermera, {
      matricula: 'MP-1',
      practicaIds: [c.curacion.id, c.inyectable.id],
      zonaIds: [c.centro.id],
    });
    expect(mismaMatricula.verificado).toBe(true);

    const otraMatricula = await enfermeros.guardarPerfil(enfermera, {
      matricula: 'MP-999',
      practicaIds: [c.curacion.id],
      zonaIds: [c.centro.id],
    });
    expect(otraMatricula.verificado).toBe(false);
  });
});
