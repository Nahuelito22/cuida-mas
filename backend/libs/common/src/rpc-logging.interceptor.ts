import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { TcpContext } from '@nestjs/microservices';
import { Observable, tap } from 'rxjs';

/** Loguea cada mensaje TCP que recibe un microservicio y cuánto tardó en responder. */
@Injectable()
export class RpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RPC');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const rpcContext = context.switchToRpc().getContext<TcpContext>();
    const patron =
      typeof rpcContext?.getPattern === 'function'
        ? rpcContext.getPattern()
        : context.getHandler().name;
    const inicio = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${patron} OK +${Date.now() - inicio}ms`),
        error: (err: unknown) =>
          this.logger.warn(
            `${patron} ERROR +${Date.now() - inicio}ms: ${describirError(err)}`,
          ),
      }),
    );
  }
}

function describirError(err: unknown): string {
  if (err && typeof err === 'object' && 'getError' in err) {
    const body = (err as { getError(): unknown }).getError();
    return typeof body === 'string' ? body : JSON.stringify(body);
  }
  return err instanceof Error ? err.message : String(err);
}
