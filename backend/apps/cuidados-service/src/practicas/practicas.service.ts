import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  convertirErrorValidacion,
  isDuplicateKeyError,
  RpcErrors,
  validarObjectId,
} from '@app/common';
import { Practica, PracticaDocument } from './practica.schema';
import { Enfermero, EnfermeroDocument } from '../enfermeros/enfermero.schema';
import { Solicitud, SolicitudDocument } from '../solicitudes/solicitud.schema';

export interface PracticaData {
  nombre: string;
  descripcion?: string;
  duracionEstimadaMin: number;
  activa?: boolean;
}

@Injectable()
export class PracticasService {
  constructor(
    @InjectModel(Practica.name)
    private readonly practicaModel: Model<PracticaDocument>,
    @InjectModel(Enfermero.name)
    private readonly enfermeroModel: Model<EnfermeroDocument>,
    @InjectModel(Solicitud.name)
    private readonly solicitudModel: Model<SolicitudDocument>,
  ) {}

  async crear(data: PracticaData): Promise<PracticaDocument> {
    try {
      return await this.practicaModel.create(data);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw RpcErrors.conflict('Ya existe una práctica con ese nombre');
      }
      return convertirErrorValidacion(error);
    }
  }

  listar(filtro: { soloActivas?: boolean } = {}): Promise<PracticaDocument[]> {
    const query = filtro.soloActivas ? { activa: true } : {};
    return this.practicaModel.find(query).sort({ nombre: 1 }).exec();
  }

  async obtener(id: string): Promise<PracticaDocument> {
    validarObjectId(id, 'práctica');
    const practica = await this.practicaModel.findById(id);
    if (!practica) throw RpcErrors.notFound('Práctica no encontrada');
    return practica;
  }

  async actualizar(
    id: string,
    data: Partial<PracticaData>,
  ): Promise<PracticaDocument> {
    validarObjectId(id, 'práctica');
    try {
      const practica = await this.practicaModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      if (!practica) throw RpcErrors.notFound('Práctica no encontrada');
      return practica;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw RpcErrors.conflict('Ya existe una práctica con ese nombre');
      }
      return convertirErrorValidacion(error);
    }
  }

  /** Solo se elimina si nadie la usa; si no, hay que desactivarla. */
  async eliminar(id: string): Promise<PracticaDocument> {
    const practica = await this.obtener(id);
    const [enUsoPorEnfermeros, enUsoPorSolicitudes] = await Promise.all([
      this.enfermeroModel.exists({ practicas: practica._id }),
      this.solicitudModel.exists({ practicas: practica._id }),
    ]);
    if (enUsoPorEnfermeros || enUsoPorSolicitudes) {
      throw RpcErrors.conflict(
        'La práctica está en uso por enfermeros o solicitudes. Desactivala en lugar de eliminarla.',
      );
    }
    await practica.deleteOne();
    return practica;
  }

  /** Verifica que todos los ids existan y estén activos. Devuelve ids sin repetir. */
  async validarIds(ids: string[] = []): Promise<string[]> {
    const unicos = [...new Set(ids.map(String))];
    unicos.forEach((id) => validarObjectId(id, 'práctica'));
    const encontradas = await this.practicaModel.countDocuments({
      _id: { $in: unicos },
      activa: true,
    });
    if (encontradas !== unicos.length) {
      throw RpcErrors.badRequest(
        'Alguna de las prácticas indicadas no existe o está inactiva',
      );
    }
    return unicos;
  }
}
