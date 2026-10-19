import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  convertirErrorValidacion,
  EstadoSolicitud,
  isDuplicateKeyError,
  Rol,
  RpcErrors,
  UsuarioActual,
  validarObjectId,
} from '@app/common';
import { Resena, ResenaDocument } from './resena.schema';
import { SolicitudesService } from './solicitudes.service';
import { EnfermerosService } from '../enfermeros/enfermeros.service';

export interface ResenaData {
  puntaje: number;
  comentario?: string;
}

@Injectable()
export class ResenasService {
  constructor(
    @InjectModel(Resena.name)
    private readonly resenaModel: Model<ResenaDocument>,
    private readonly solicitudesService: SolicitudesService,
    private readonly enfermerosService: EnfermerosService,
  ) {}

  async crear(
    usuario: UsuarioActual,
    solicitudId: string,
    data: ResenaData,
  ): Promise<ResenaDocument> {
    const solicitud = await this.solicitudesService.buscar(solicitudId);
    if (usuario.rol !== Rol.PACIENTE || solicitud.pacienteId !== usuario.id) {
      throw RpcErrors.forbidden(
        'Solo el paciente de la solicitud puede calificarla',
      );
    }
    if (
      solicitud.estado !== EstadoSolicitud.FINALIZADA ||
      !solicitud.enfermero
    ) {
      throw RpcErrors.conflict('Solo se pueden calificar cuidados finalizados');
    }

    let resena: ResenaDocument;
    try {
      resena = await this.resenaModel.create({
        solicitud: solicitud._id,
        enfermero: solicitud.enfermero,
        pacienteId: usuario.id,
        pacienteNombre: solicitud.pacienteNombre,
        puntaje: data.puntaje,
        comentario: data.comentario,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw RpcErrors.conflict('Esta solicitud ya fue calificada');
      }
      return convertirErrorValidacion(error);
    }

    await this.recalcularPuntaje(solicitud.enfermero);
    return resena;
  }

  listarPorEnfermero(enfermeroId: string): Promise<ResenaDocument[]> {
    validarObjectId(enfermeroId, 'enfermero');
    return this.resenaModel
      .find({ enfermero: new Types.ObjectId(enfermeroId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async recalcularPuntaje(enfermeroId: Types.ObjectId): Promise<void> {
    const [resultado] = await this.resenaModel.aggregate<{
      promedio: number;
      cantidad: number;
    }>([
      { $match: { enfermero: enfermeroId } },
      {
        $group: {
          _id: '$enfermero',
          promedio: { $avg: '$puntaje' },
          cantidad: { $sum: 1 },
        },
      },
    ]);
    await this.enfermerosService.actualizarPuntaje(
      enfermeroId,
      Math.round((resultado?.promedio ?? 0) * 10) / 10,
      resultado?.cantidad ?? 0,
    );
  }
}
