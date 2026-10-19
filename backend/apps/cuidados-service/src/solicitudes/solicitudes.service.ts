import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  convertirErrorValidacion,
  EstadoSolicitud,
  OrigenSolicitud,
  puedeTransicionar,
  Rol,
  RpcErrors,
  UsuarioActual,
  validarObjectId,
} from '@app/common';
import { Solicitud, SolicitudDocument } from './solicitud.schema';
import { EnfermerosService } from '../enfermeros/enfermeros.service';
import { EnfermeroDocument } from '../enfermeros/enfermero.schema';
import { PracticasService } from '../practicas/practicas.service';
import { ZonasService } from '../zonas/zonas.service';

export interface SolicitudData {
  /** Solo lo indica el centro de salud al derivar; el paciente se toma del token. */
  pacienteId?: string;
  pacienteNombre?: string;
  centroOrigen?: string;
  zonaId: string;
  practicaIds: string[];
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  frecuencia: string;
  observaciones?: string;
}

export interface SolicitudFiltro {
  estado?: EstadoSolicitud;
  zonaId?: string;
  /** Para enfermeros: solicitudes que puede tomar o las que ya tiene asignadas. */
  vista?: 'disponibles' | 'asignadas';
}

const POPULATE = [
  { path: 'zona', select: 'nombre departamento' },
  { path: 'practicas', select: 'nombre duracionEstimadaMin' },
  {
    path: 'enfermero',
    select:
      'nombre apellido matricula telefono puntajePromedio cantidadResenas',
  },
];

/** Id del enfermero asignado, esté o no completada la relación. */
function enfermeroAsignadoId(solicitud: SolicitudDocument): string | null {
  const enfermero = solicitud.enfermero as unknown as
    { _id: Types.ObjectId } | Types.ObjectId | null;
  if (!enfermero) return null;
  return String('_id' in enfermero ? enfermero._id : enfermero);
}

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectModel(Solicitud.name)
    private readonly solicitudModel: Model<SolicitudDocument>,
    private readonly enfermerosService: EnfermerosService,
    private readonly practicasService: PracticasService,
    private readonly zonasService: ZonasService,
  ) {}

  async crear(
    usuario: UsuarioActual,
    data: SolicitudData,
  ): Promise<SolicitudDocument> {
    let paciente: { id: string; nombre: string };
    let origen: OrigenSolicitud;

    if (usuario.rol === Rol.PACIENTE) {
      paciente = {
        id: usuario.id,
        nombre: `${usuario.nombre} ${usuario.apellido}`,
      };
      origen = OrigenSolicitud.PARTICULAR;
    } else if (usuario.rol === Rol.ADMIN) {
      if (!data.pacienteId || !data.pacienteNombre) {
        throw RpcErrors.badRequest('Para derivar hay que indicar el paciente');
      }
      paciente = { id: data.pacienteId, nombre: data.pacienteNombre };
      origen = OrigenSolicitud.DERIVACION;
    } else {
      throw RpcErrors.forbidden('Los enfermeros no pueden crear solicitudes');
    }

    await this.zonasService.validarId(data.zonaId);
    const practicaIds = await this.validarPracticas(data.practicaIds);
    const { inicio, fin } = this.validarFechas(data.fechaInicio, data.fechaFin);

    try {
      const solicitud = await this.solicitudModel.create({
        pacienteId: paciente.id,
        pacienteNombre: paciente.nombre,
        creadaPorId: usuario.id,
        origen,
        centroOrigen:
          origen === OrigenSolicitud.DERIVACION ? data.centroOrigen : undefined,
        zona: new Types.ObjectId(data.zonaId),
        practicas: practicaIds.map((id) => new Types.ObjectId(id)),
        direccion: data.direccion,
        fechaInicio: inicio,
        fechaFin: fin,
        frecuencia: data.frecuencia,
        observaciones: data.observaciones,
      });
      return await solicitud.populate(POPULATE);
    } catch (error) {
      return convertirErrorValidacion(error);
    }
  }

  async listar(
    usuario: UsuarioActual,
    filtro: SolicitudFiltro = {},
  ): Promise<SolicitudDocument[]> {
    const query: Record<string, unknown> = {};
    if (filtro.estado) query.estado = filtro.estado;

    if (usuario.rol === Rol.ADMIN) {
      if (filtro.zonaId) {
        validarObjectId(filtro.zonaId, 'zona');
        query.zona = new Types.ObjectId(filtro.zonaId);
      }
    } else if (usuario.rol === Rol.PACIENTE) {
      query.pacienteId = usuario.id;
    } else {
      const perfil = await this.enfermerosService.buscarPorUsuario(usuario.id);
      if (!perfil) return [];
      if (filtro.vista === 'disponibles') {
        if (!perfil.verificado) return [];
        // Pendientes en sus zonas y cuyas prácticas estén TODAS dentro de las que realiza.
        query.estado = EstadoSolicitud.PENDIENTE;
        query.zona = { $in: perfil.zonas };
        query.practicas = { $not: { $elemMatch: { $nin: perfil.practicas } } };
      } else {
        query.enfermero = perfil._id;
      }
    }

    return this.solicitudModel
      .find(query)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Devuelve la solicitud si el usuario tiene permiso para verla. */
  async obtener(
    usuario: UsuarioActual,
    id: string,
  ): Promise<SolicitudDocument> {
    const solicitud = await this.buscar(id);
    await this.asegurarAcceso(usuario, solicitud);
    return await solicitud.populate(POPULATE);
  }

  async actualizar(
    usuario: UsuarioActual,
    id: string,
    cambios: Partial<SolicitudData>,
  ): Promise<SolicitudDocument> {
    const solicitud = await this.buscar(id);
    this.asegurarDuenioOAdmin(usuario, solicitud);
    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw RpcErrors.conflict(
        'Solo se puede modificar una solicitud que todavía está pendiente',
      );
    }

    if (cambios.zonaId) {
      await this.zonasService.validarId(cambios.zonaId);
      solicitud.zona = new Types.ObjectId(cambios.zonaId);
    }
    if (cambios.practicaIds) {
      const practicaIds = await this.validarPracticas(cambios.practicaIds);
      solicitud.practicas = practicaIds.map((p) => new Types.ObjectId(p));
    }
    if (cambios.fechaInicio || cambios.fechaFin) {
      const { inicio, fin } = this.validarFechas(
        cambios.fechaInicio ?? solicitud.fechaInicio.toISOString(),
        cambios.fechaFin ?? solicitud.fechaFin.toISOString(),
      );
      solicitud.fechaInicio = inicio;
      solicitud.fechaFin = fin;
    }
    if (cambios.direccion !== undefined)
      solicitud.direccion = cambios.direccion;
    if (cambios.frecuencia !== undefined)
      solicitud.frecuencia = cambios.frecuencia;
    if (cambios.observaciones !== undefined) {
      solicitud.observaciones = cambios.observaciones;
    }
    if (cambios.centroOrigen !== undefined && usuario.rol === Rol.ADMIN) {
      solicitud.centroOrigen = cambios.centroOrigen;
    }

    try {
      await solicitud.save();
    } catch (error) {
      convertirErrorValidacion(error);
    }
    return await solicitud.populate(POPULATE);
  }

  async eliminar(
    usuario: UsuarioActual,
    id: string,
  ): Promise<SolicitudDocument> {
    const solicitud = await this.buscar(id);
    this.asegurarDuenioOAdmin(usuario, solicitud);
    const eliminable = [EstadoSolicitud.PENDIENTE, EstadoSolicitud.CANCELADA];
    if (!eliminable.includes(solicitud.estado)) {
      throw RpcErrors.conflict(
        'No se puede eliminar una solicitud con atención en curso o finalizada',
      );
    }
    await solicitud.populate(POPULATE);
    await solicitud.deleteOne();
    return solicitud;
  }

  /** Un enfermero verificado toma una solicitud pendiente compatible con su perfil. */
  async aceptar(
    usuario: UsuarioActual,
    id: string,
  ): Promise<SolicitudDocument> {
    if (usuario.rol !== Rol.ENFERMERO) {
      throw RpcErrors.forbidden('Solo un enfermero puede aceptar solicitudes');
    }
    const perfil = await this.enfermerosService.buscarPorUsuario(usuario.id);
    if (!perfil) {
      throw RpcErrors.badRequest('Primero completá tu perfil profesional');
    }
    if (!perfil.verificado) {
      throw RpcErrors.forbidden('Tu matrícula todavía no fue verificada');
    }

    const solicitud = await this.buscar(id);
    this.asegurarTransicion(solicitud, EstadoSolicitud.ACEPTADA);
    if (!this.esCompatible(perfil, solicitud)) {
      throw RpcErrors.forbidden(
        'La solicitud está fuera de tus zonas o requiere prácticas que no realizás',
      );
    }

    // La condición `estado: PENDIENTE` evita que dos enfermeros acepten a la vez.
    const aceptada = await this.solicitudModel
      .findOneAndUpdate(
        { _id: solicitud._id, estado: EstadoSolicitud.PENDIENTE },
        {
          estado: EstadoSolicitud.ACEPTADA,
          enfermero: perfil._id,
          fechaAceptacion: new Date(),
        },
        { new: true },
      )
      .populate(POPULATE);
    if (!aceptada) {
      throw RpcErrors.conflict('Otro enfermero ya aceptó esta solicitud');
    }
    return aceptada;
  }

  async cancelar(
    usuario: UsuarioActual,
    id: string,
    motivo?: string,
  ): Promise<SolicitudDocument> {
    const solicitud = await this.buscar(id);
    this.asegurarDuenioOAdmin(usuario, solicitud);
    this.asegurarTransicion(solicitud, EstadoSolicitud.CANCELADA);
    solicitud.estado = EstadoSolicitud.CANCELADA;
    solicitud.motivoCancelacion = motivo?.trim() || undefined;
    await solicitud.save();
    return await solicitud.populate(POPULATE);
  }

  async finalizar(
    usuario: UsuarioActual,
    id: string,
  ): Promise<SolicitudDocument> {
    const solicitud = await this.buscar(id);
    if (usuario.rol !== Rol.ADMIN) {
      await this.asegurarEnfermeroAsignado(usuario, solicitud);
    }
    this.asegurarTransicion(solicitud, EstadoSolicitud.FINALIZADA);
    solicitud.estado = EstadoSolicitud.FINALIZADA;
    solicitud.fechaFinalizacion = new Date();
    await solicitud.save();
    return await solicitud.populate(POPULATE);
  }

  // ---------- Helpers usados también por visitas y reseñas ----------

  async buscar(id: string): Promise<SolicitudDocument> {
    validarObjectId(id, 'solicitud');
    const solicitud = await this.solicitudModel.findById(id);
    if (!solicitud) throw RpcErrors.notFound('Solicitud no encontrada');
    return solicitud;
  }

  asegurarTransicion(
    solicitud: SolicitudDocument,
    hacia: EstadoSolicitud,
  ): void {
    if (!puedeTransicionar(solicitud.estado, hacia)) {
      throw RpcErrors.conflict(
        `No se puede pasar una solicitud de ${solicitud.estado} a ${hacia}`,
      );
    }
  }

  async asegurarEnfermeroAsignado(
    usuario: UsuarioActual,
    solicitud: SolicitudDocument,
  ): Promise<EnfermeroDocument> {
    const perfil =
      usuario.rol === Rol.ENFERMERO
        ? await this.enfermerosService.buscarPorUsuario(usuario.id)
        : null;
    if (!perfil || enfermeroAsignadoId(solicitud) !== String(perfil._id)) {
      throw RpcErrors.forbidden(
        'No sos el enfermero asignado a esta solicitud',
      );
    }
    return perfil;
  }

  private asegurarDuenioOAdmin(
    usuario: UsuarioActual,
    solicitud: SolicitudDocument,
  ): void {
    const esDuenio =
      usuario.rol === Rol.PACIENTE && solicitud.pacienteId === usuario.id;
    if (usuario.rol !== Rol.ADMIN && !esDuenio) {
      throw RpcErrors.forbidden('No tenés permiso sobre esta solicitud');
    }
  }

  private async asegurarAcceso(
    usuario: UsuarioActual,
    solicitud: SolicitudDocument,
  ): Promise<void> {
    if (usuario.rol === Rol.ADMIN) return;
    if (usuario.rol === Rol.PACIENTE && solicitud.pacienteId === usuario.id) {
      return;
    }
    if (usuario.rol === Rol.ENFERMERO) {
      const perfil = await this.enfermerosService.buscarPorUsuario(usuario.id);
      const asignado =
        !!perfil && enfermeroAsignadoId(solicitud) === String(perfil._id);
      // Las pendientes las puede ver para decidir si las acepta.
      if (asignado || solicitud.estado === EstadoSolicitud.PENDIENTE) return;
    }
    throw RpcErrors.forbidden('No tenés permiso para ver esta solicitud');
  }

  private esCompatible(
    perfil: EnfermeroDocument,
    solicitud: SolicitudDocument,
  ): boolean {
    const zonas = perfil.zonas.map(String);
    const practicas = perfil.practicas.map(String);
    return (
      zonas.includes(String(solicitud.zona)) &&
      solicitud.practicas.every((p) => practicas.includes(String(p)))
    );
  }

  private async validarPracticas(ids: string[] = []): Promise<string[]> {
    if (!ids.length) {
      throw RpcErrors.badRequest('Debe indicar al menos una práctica');
    }
    return this.practicasService.validarIds(ids);
  }

  private validarFechas(
    fechaInicio: string,
    fechaFin: string,
  ): { inicio: Date; fin: Date } {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      throw RpcErrors.badRequest('Las fechas no son válidas');
    }
    if (fin < inicio) {
      throw RpcErrors.badRequest(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }
    return { inicio, fin };
  }
}
