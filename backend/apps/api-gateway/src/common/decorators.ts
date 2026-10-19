import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Rol, UsuarioActual as UsuarioActualData } from '@app/common';
import { obtenerHttp } from './contexto';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Marca una ruta como accesible sin token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe una ruta a ciertos roles. */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

/** Inyecta el usuario autenticado (sirve en REST y en GraphQL). */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioActualData => {
    const { user } = obtenerHttp(context).req;
    if (!user) {
      throw new Error('UsuarioActual usado en una ruta pública');
    }
    return {
      id: user.sub,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido,
    };
  },
);
