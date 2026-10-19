import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RpcErrorBody } from './interfaces';

/**
 * Errores de negocio de los microservicios. Llevan un código HTTP para que el
 * gateway pueda devolver al cliente la respuesta correcta (404, 409, etc.).
 */
function rpcError(statusCode: number, message: string): RpcException {
  const body: RpcErrorBody = { statusCode, message };
  return new RpcException(body);
}

export const RpcErrors = {
  badRequest: (message: string) => rpcError(HttpStatus.BAD_REQUEST, message),
  unauthorized: (message: string) => rpcError(HttpStatus.UNAUTHORIZED, message),
  forbidden: (message: string) => rpcError(HttpStatus.FORBIDDEN, message),
  notFound: (message: string) => rpcError(HttpStatus.NOT_FOUND, message),
  conflict: (message: string) => rpcError(HttpStatus.CONFLICT, message),
};

/** Código de error de MongoDB cuando se viola un índice único. */
export const MONGO_DUPLICATE_KEY = 11000;

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === MONGO_DUPLICATE_KEY
  );
}
