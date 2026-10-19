import { Rol } from './enums';

/** Datos que viajan dentro del JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
  nombre: string;
  apellido: string;
}

/** Usuario autenticado que el gateway le pasa a los microservicios para validar permisos. */
export interface UsuarioActual {
  id: string;
  rol: Rol;
  nombre: string;
  apellido: string;
}

/** Forma estándar de los errores que viajan por TCP. */
export interface RpcErrorBody {
  statusCode: number;
  message: string | string[];
}
