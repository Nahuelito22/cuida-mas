import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import type { GraphQLFormattedError } from 'graphql';
import { AuthController } from './auth/auth.controller';
import { GqlThrottlerGuard, JwtAuthGuard, RolesGuard } from './common/guards';
import { LoggingInterceptor } from './common/logging.interceptor';
import { MicroserviciosModule } from './common/microservicios.module';
import { EnfermerosController } from './enfermeros/enfermeros.controller';
import { EstadisticasController } from './estadisticas/estadisticas.controller';
import { PracticasResolver } from './practicas/practicas.resolver';
import { SolicitudesController } from './solicitudes/solicitudes.controller';
import { SolicitudesResolver } from './solicitudes/solicitudes.resolver';
import { UsuariosController } from './usuarios/usuarios.controller';
import { ZonasController } from './zonas/zonas.controller';

/** Deja en los errores GraphQL solo el mensaje legible y el código HTTP. */
function formatearErrorGraphQL(error: GraphQLFormattedError) {
  const original = error.extensions?.originalError as
    { message?: string | string[]; statusCode?: number } | undefined;
  const message = Array.isArray(original?.message)
    ? original.message.join('. ')
    : (original?.message ?? error.message);
  return {
    message,
    path: error.path,
    extensions: { code: error.extensions?.code, status: original?.statusCode },
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MicroserviciosModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    // 120 peticiones por minuto por IP (el login tiene un límite propio más bajo).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
      formatError: formatearErrorGraphQL,
    }),
  ],
  controllers: [
    AuthController,
    UsuariosController,
    ZonasController,
    EnfermerosController,
    SolicitudesController,
    EstadisticasController,
  ],
  providers: [
    PracticasResolver,
    SolicitudesResolver,
    // El orden importa: primero el límite de peticiones, luego el token y por último el rol.
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
