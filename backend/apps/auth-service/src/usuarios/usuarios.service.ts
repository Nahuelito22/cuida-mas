import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import {
  convertirErrorValidacion,
  escaparRegex,
  isDuplicateKeyError,
  Rol,
  RpcErrors,
  validarObjectId,
} from '@app/common';
import { Usuario, UsuarioDocument } from './usuario.schema';

export interface CrearUsuarioData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  rol?: Rol;
}

export interface BuscarUsuariosFiltro {
  rol?: Rol;
  q?: string;
}

const SALT_ROUNDS = 10;
const MIN_PASSWORD = 8;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async crear(data: CrearUsuarioData): Promise<UsuarioDocument> {
    if (!data.password || data.password.length < MIN_PASSWORD) {
      throw RpcErrors.badRequest(
        `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`,
      );
    }

    const email = data.email?.trim().toLowerCase();
    if (await this.usuarioModel.exists({ email })) {
      throw RpcErrors.conflict('Ya existe un usuario registrado con ese email');
    }
    if (await this.usuarioModel.exists({ dni: data.dni })) {
      throw RpcErrors.conflict('Ya existe un usuario registrado con ese DNI');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    try {
      const usuario = await this.usuarioModel.create({
        email,
        passwordHash,
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni,
        telefono: data.telefono,
        rol: data.rol ?? Rol.PACIENTE,
      });
      // Se vuelve a leer para no exponer el hash de la contraseña.
      return (await this.usuarioModel.findById(usuario.id))!;
    } catch (error) {
      // Carrera entre dos registros simultáneos: el índice único lo frena.
      if (isDuplicateKeyError(error)) {
        throw RpcErrors.conflict('El email o DNI ya está registrado');
      }
      return convertirErrorValidacion(error);
    }
  }

  buscarPorEmailConPassword(email: string) {
    return this.usuarioModel
      .findOne({ email: email?.trim().toLowerCase() })
      .select('+passwordHash');
  }

  async obtener(id: string): Promise<UsuarioDocument> {
    validarObjectId(id, 'usuario');
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) throw RpcErrors.notFound('Usuario no encontrado');
    return usuario;
  }

  buscar(filtro: BuscarUsuariosFiltro): Promise<UsuarioDocument[]> {
    const query: Record<string, unknown> = {};
    if (filtro.rol) query.rol = filtro.rol;
    if (filtro.q?.trim()) {
      const regex = new RegExp(escaparRegex(filtro.q.trim()), 'i');
      query.$or = [
        { nombre: regex },
        { apellido: regex },
        { email: regex },
        { dni: regex },
      ];
    }
    return this.usuarioModel
      .find(query)
      .sort({ apellido: 1, nombre: 1 })
      .limit(20)
      .exec();
  }
}
