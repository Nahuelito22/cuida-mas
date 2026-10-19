import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { AUTH_SERVICE, CUIDADOS_SERVICE, RpcErrorBody } from '@app/common';

const TIMEOUT_MS = 5000;
const logger = new Logger('Microservicios');

/**
 * Envía un mensaje TCP y espera la respuesta. Si el microservicio responde con
 * un error de negocio ({ statusCode, message }) se convierte en el HttpException
 * equivalente, así el cliente recibe 404/409/etc. en lugar de un 500 genérico.
 */
async function enviar<T>(
  client: ClientProxy,
  servicio: string,
  patron: string,
  data: unknown,
): Promise<T> {
  try {
    return await firstValueFrom(
      client.send<T>(patron, data ?? {}).pipe(timeout(TIMEOUT_MS)),
    );
  } catch (error) {
    throw convertirError(error, servicio, patron);
  }
}

function convertirError(
  error: unknown,
  servicio: string,
  patron: string,
): HttpException {
  if (error instanceof TimeoutError) {
    logger.error(`${servicio} no respondió a tiempo (${patron})`);
    return new HttpException(
      `El servicio ${servicio} no respondió a tiempo`,
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
  const body = error as Partial<RpcErrorBody> & { code?: string };
  if (typeof body?.statusCode === 'number' && body.message) {
    return new HttpException(
      { statusCode: body.statusCode, message: body.message },
      body.statusCode,
    );
  }
  if (body?.code === 'ECONNREFUSED') {
    logger.error(`${servicio} no está disponible (${patron})`);
    return new HttpException(
      `El servicio ${servicio} no está disponible`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
  logger.error(`Error inesperado en ${servicio} (${patron})`, error as Error);
  return new HttpException(
    'Error interno del servidor',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}

@Injectable()
export class AuthClient {
  constructor(@Inject(AUTH_SERVICE) private readonly client: ClientProxy) {}

  send<T = unknown>(patron: string, data?: unknown): Promise<T> {
    return enviar<T>(this.client, 'auth-service', patron, data);
  }
}

@Injectable()
export class CuidadosClient {
  constructor(@Inject(CUIDADOS_SERVICE) private readonly client: ClientProxy) {}

  send<T = unknown>(patron: string, data?: unknown): Promise<T> {
    return enviar<T>(this.client, 'cuidados-service', patron, data);
  }
}
