import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  convertirErrorValidacion,
  escaparRegex,
  isDuplicateKeyError,
  Rol,
  RpcErrors,
  UsuarioActual,
  validarObjectId,
} from '@app/common';
import { Enfermero, EnfermeroDocument } from './enfermero.schema';
import { PracticasService } from '../practicas/practicas.service';
import { ZonasService } from '../zonas/zonas.service';

export interface PerfilEnfermeroData {
  matricula: string;
  telefono?: string;
  bio?: string;
  zonaIds: string[];
  practicaIds: string[];
}

export interface BuscarEnfermerosFiltro {
  zonaId?: string;
  practicaId?: string;
  q?: string;
  /** Pacientes y enfermeros solo ven verificados; el admin puede ver todos. */
  verificado?: boolean;
}

/** Relaciones que se completan al devolver un enfermero. */
const POPULATE = [
  { path: 'zonas', select: 'nombre departamento' },
  { path: 'practicas', select: 'nombre duracionEstimadaMin activa' },
];

@Injectable()
export class EnfermerosService {
  constructor(
    @InjectModel(Enfermero.name)
    private readonly enfermeroModel: Model<EnfermeroDocument>,
    private readonly practicasService: PracticasService,
    private readonly zonasService: ZonasService,
  ) {}

  /** Crea o actualiza el perfil profesional del enfermero que está logueado. */
  async guardarPerfil(
    usuario: UsuarioActual,
    data: PerfilEnfermeroData,
  ): Promise<EnfermeroDocument> {
    if (usuario.rol !== Rol.ENFERMERO) {
      throw RpcErrors.forbidden(
        'Solo un enfermero puede tener perfil profesional',
      );
    }
    const [zonaIds, practicaIds] = await Promise.all([
      this.zonasService.validarIds(data.zonaIds),
      this.practicasService.validarIds(data.practicaIds),
    ]);

    const existente = await this.enfermeroModel.findOne({
      usuarioId: usuario.id,
    });
    const matricula = data.matricula?.trim().toUpperCase();
    // Si cambia la matrícula, el centro de salud tiene que volver a verificarla.
    const verificado =
      existente?.matricula === matricula ? existente.verificado : false;

    try {
      const perfil = await this.enfermeroModel.findOneAndUpdate(
        { usuarioId: usuario.id },
        {
          usuarioId: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          matricula,
          telefono: data.telefono,
          bio: data.bio,
          zonas: zonaIds.map((id) => new Types.ObjectId(id)),
          practicas: practicaIds.map((id) => new Types.ObjectId(id)),
          verificado,
        },
        { new: true, upsert: true, runValidators: true },
      );
      return await perfil.populate(POPULATE);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw RpcErrors.conflict(
          'La matrícula ya está registrada por otro enfermero',
        );
      }
      return convertirErrorValidacion(error);
    }
  }

  async miPerfil(usuarioId: string): Promise<EnfermeroDocument> {
    const perfil = await this.enfermeroModel
      .findOne({ usuarioId })
      .populate(POPULATE);
    if (!perfil) {
      throw RpcErrors.notFound('Todavía no completaste tu perfil profesional');
    }
    return perfil;
  }

  /** Perfil sin relaciones completadas, para reglas de negocio de otros servicios. */
  buscarPorUsuario(usuarioId: string) {
    return this.enfermeroModel.findOne({ usuarioId });
  }

  async obtener(id: string): Promise<EnfermeroDocument> {
    validarObjectId(id, 'enfermero');
    const enfermero = await this.enfermeroModel.findById(id).populate(POPULATE);
    if (!enfermero) throw RpcErrors.notFound('Enfermero no encontrado');
    return enfermero;
  }

  buscar(filtro: BuscarEnfermerosFiltro): Promise<EnfermeroDocument[]> {
    const query: Record<string, unknown> = {};
    if (filtro.verificado !== undefined) query.verificado = filtro.verificado;
    if (filtro.zonaId) {
      validarObjectId(filtro.zonaId, 'zona');
      query.zonas = new Types.ObjectId(filtro.zonaId);
    }
    if (filtro.practicaId) {
      validarObjectId(filtro.practicaId, 'práctica');
      query.practicas = new Types.ObjectId(filtro.practicaId);
    }
    if (filtro.q?.trim()) {
      const regex = new RegExp(escaparRegex(filtro.q.trim()), 'i');
      query.$or = [
        { nombre: regex },
        { apellido: regex },
        { matricula: regex },
      ];
    }
    return this.enfermeroModel
      .find(query)
      .populate(POPULATE)
      .sort({ verificado: -1, puntajePromedio: -1, apellido: 1 })
      .exec();
  }

  async verificar(id: string, verificado: boolean): Promise<EnfermeroDocument> {
    validarObjectId(id, 'enfermero');
    const enfermero = await this.enfermeroModel
      .findByIdAndUpdate(id, { verificado }, { new: true })
      .populate(POPULATE);
    if (!enfermero) throw RpcErrors.notFound('Enfermero no encontrado');
    return enfermero;
  }

  async actualizarPuntaje(
    enfermeroId: Types.ObjectId,
    puntajePromedio: number,
    cantidadResenas: number,
  ): Promise<void> {
    await this.enfermeroModel.updateOne(
      { _id: enfermeroId },
      { puntajePromedio, cantidadResenas },
    );
  }
}
