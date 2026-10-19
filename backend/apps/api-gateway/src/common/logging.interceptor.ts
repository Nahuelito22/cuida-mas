import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';
import { obtenerHttp } from './contexto';

/** Registra cada petición: método/operación, usuario, resultado y duración. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { req } = obtenerHttp(context);
    const descripcion =
      context.getType<GqlContextType>() === 'graphql'
        ? `GraphQL ${GqlExecutionContext.create(context).getInfo<{ fieldName: string }>().fieldName}`
        : `${req.method} ${req.originalUrl}`;
    const inicio = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const usuario = req.user
            ? ` [${req.user.rol} ${req.user.email}]`
            : '';
          this.logger.log(`${descripcion}${usuario} +${Date.now() - inicio}ms`);
        },
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          const mensaje = `${descripcion} -> ${status} +${Date.now() - inicio}ms`;
          if (status >= 500) this.logger.error(mensaje);
          else this.logger.warn(mensaje);
        },
      }),
    );
  }
}
