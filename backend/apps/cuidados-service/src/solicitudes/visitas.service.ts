import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  convertirErrorValidacion,
  EstadoSolicitud,
  RpcErrors,
  UsuarioActual,
} from '@app/common';
import { Visita, VisitaDocument } from './visita.schema';
import { SolicitudesService } from './solicitudes.service';

export interface VisitaData {
  fecha?: string;
  practicaIds?: string[];
  observaciones: string;
  presionArterial?: string;
  temperatura?: number;
}

/** Margen por diferencias de reloj entre el dispositivo y el servidor. */
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

@Injectable()
export class VisitasService {
  constructor(
    @InjectModel(Visita.name)
    private readonly visitaModel: Model<VisitaDocument>,
    private readonly solicitudesService: SolicitudesService,
  ) {}

  async registrar(
    usuario: UsuarioActual,
    solicitudId: string,
    data: VisitaData,
  ): Promise<VisitaDocument> {
    const solicitud = await this.solicitudesService.buscar(solicitudId);
    const enfermero = await this.solicitudesService.asegurarEnfermeroAsignado(
      usuario,
      solicitud,
    );

    const estadosConVisitas = [
      EstadoSolicitud.ACEPTADA,
      EstadoSolicitud.EN_CURSO,
    ];
    if (!estadosConVisitas.includes(solicitud.estado)) {
      throw RpcErrors.conflict(
        `No se pueden registrar visitas en una solicitud ${solicitud.estado}`,
      );
    }

    const practicasDelPlan = solicitud.practicas.map(String);
    const practicaIds = [...new Set(data.practicaIds ?? [])];
    if (practicaIds.some((id) => !practicasDelPlan.includes(id))) {
      throw RpcErrors.badRequest(
        'Solo se pueden registrar prácticas incluidas en el plan de cuidados',
      );
    }

    const fecha = data.fecha ? new Date(data.fecha) : new Date();
    if (Number.isNaN(fecha.getTime())) {
      throw RpcErrors.badRequest('La fecha de la visita no es válida');
    }
    if (fecha.getTime() > Date.now() + TOLERANCIA_FUTURO_MS) {
      throw RpcErrors.badRequest('La fecha de la visita no puede ser futura');
    }

    let visita: VisitaDocument;
    try {
      visita = await this.visitaModel.create({
        solicitud: solicitud._id,
        enfermero: enfermero._id,
        fecha,
        practicasRealizadas: practicaIds.map((id) => new Types.ObjectId(id)),
        observaciones: data.observaciones,
        presionArterial: data.presionArterial || undefined,
        temperatura: data.temperatura,
      });
    } catch (error) {
      return convertirErrorValidacion(error);
    }

    // La primera visita pone el plan "en curso".
    if (solicitud.estado === EstadoSolicitud.ACEPTADA) {
      this.solicitudesService.asegurarTransicion(
        solicitud,
        EstadoSolicitud.EN_CURSO,
      );
      solicitud.estado = EstadoSolicitud.EN_CURSO;
      await solicitud.save();
    }

    return visita.populate([
      { path: 'practicasRealizadas', select: 'nombre' },
      { path: 'enfermero', select: 'nombre apellido matricula' },
    ]);
  }

  /** Bitácora completa; la ven el paciente, el enfermero asignado y el centro. */
  async listar(
    usuario: UsuarioActual,
    solicitudId: string,
  ): Promise<VisitaDocument[]> {
    const solicitud = await this.solicitudesService.obtener(
      usuario,
      solicitudId,
    );
    return this.visitaModel
      .find({ solicitud: solicitud._id })
      .populate([
        { path: 'practicasRealizadas', select: 'nombre' },
        { path: 'enfermero', select: 'nombre apellido matricula' },
      ])
      .sort({ fecha: -1 })
      .exec();
  }
}
