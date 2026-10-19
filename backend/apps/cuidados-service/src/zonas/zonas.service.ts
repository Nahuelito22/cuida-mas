import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  convertirErrorValidacion,
  isDuplicateKeyError,
  RpcErrors,
  validarObjectId,
} from '@app/common';
import { Zona, ZonaDocument } from './zona.schema';

export interface ZonaData {
  nombre: string;
  departamento: string;
}

@Injectable()
export class ZonasService {
  constructor(
    @InjectModel(Zona.name) private readonly zonaModel: Model<ZonaDocument>,
  ) {}

  async crear(data: ZonaData): Promise<ZonaDocument> {
    try {
      return await this.zonaModel.create(data);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw RpcErrors.conflict('Ya existe una zona con ese nombre');
      }
      return convertirErrorValidacion(error);
    }
  }

  listar(): Promise<ZonaDocument[]> {
    return this.zonaModel.find().sort({ departamento: 1, nombre: 1 }).exec();
  }

  async validarId(id: string): Promise<void> {
    validarObjectId(id, 'zona');
    if (!(await this.zonaModel.exists({ _id: id }))) {
      throw RpcErrors.badRequest('La zona indicada no existe');
    }
  }

  async validarIds(ids: string[] = []): Promise<string[]> {
    const unicos = [...new Set(ids.map(String))];
    unicos.forEach((id) => validarObjectId(id, 'zona'));
    const encontradas = await this.zonaModel.countDocuments({
      _id: { $in: unicos },
    });
    if (encontradas !== unicos.length) {
      throw RpcErrors.badRequest('Alguna de las zonas indicadas no existe');
    }
    return unicos;
  }
}
