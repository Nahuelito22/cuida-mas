import { ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import type { JwtPayload } from '@app/common';

export type RequestConUsuario = Request & { user?: JwtPayload };

/** Obtiene request/response tanto para rutas REST como para operaciones GraphQL. */
export function obtenerHttp(context: ExecutionContext): {
  req: RequestConUsuario;
  res: Response;
} {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<{
      req: RequestConUsuario;
      res: Response;
    }>();
  }
  const http = context.switchToHttp();
  return {
    req: http.getRequest<RequestConUsuario>(),
    res: http.getResponse<Response>(),
  };
}
