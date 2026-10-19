import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { JwtPayload, Rol, RpcErrors } from '@app/common';
import {
  CrearUsuarioData,
  UsuariosService,
} from '../usuarios/usuarios.service';
import { UsuarioDocument } from '../usuarios/usuario.schema';

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResultado {
  accessToken: string;
  usuario: UsuarioDocument;
}

/** Roles que una persona puede elegir al registrarse. ADMIN solo se crea por seed. */
const ROLES_REGISTRABLES = [Rol.PACIENTE, Rol.ENFERMERO];

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  registrar(data: CrearUsuarioData): Promise<UsuarioDocument> {
    const rol = data.rol ?? Rol.PACIENTE;
    if (!ROLES_REGISTRABLES.includes(rol)) {
      throw RpcErrors.forbidden('No se puede registrar un usuario con ese rol');
    }
    return this.usuariosService.crear({ ...data, rol });
  }

  async login({ email, password }: LoginData): Promise<LoginResultado> {
    const usuario = await this.usuariosService.buscarPorEmailConPassword(email);
    // Mismo mensaje para email inexistente o contraseña incorrecta: no revela qué falló.
    const valido =
      usuario && (await bcrypt.compare(password ?? '', usuario.passwordHash));
    if (!usuario || !valido) {
      throw RpcErrors.unauthorized('Email o contraseña incorrectos');
    }
    if (!usuario.activo) {
      throw RpcErrors.forbidden('El usuario está deshabilitado');
    }

    const payload: JwtPayload = {
      sub: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: await this.usuariosService.obtener(usuario._id.toString()),
    };
  }
}
