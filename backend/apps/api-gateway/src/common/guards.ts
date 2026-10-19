import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtPayload, Rol } from '@app/common';
import { obtenerHttp } from './contexto';
import { IS_PUBLIC_KEY, ROLES_KEY } from './decorators';

/** Valida el JWT del header Authorization en todas las rutas no públicas. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublica) return true;

    const { req } = obtenerHttp(context);
    const [tipo, token] = req.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token de acceso');
    }
    try {
      req.user = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }
    return true;
  }
}

/** Verifica que el rol del usuario esté entre los permitidos por @Roles(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;

    const { user } = obtenerHttp(context).req;
    if (!user || !roles.includes(user.rol)) {
      throw new ForbiddenException('No tenés permisos para esta acción');
    }
    return true;
  }
}

/** Límite de peticiones por IP, adaptado para que también funcione en GraphQL. */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const { req, res } = obtenerHttp(context);
    return {
      req: req as unknown as Record<string, any>,
      res: res as unknown as Record<string, any>,
    };
  }
}
