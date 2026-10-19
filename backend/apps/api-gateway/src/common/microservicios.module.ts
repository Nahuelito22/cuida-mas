import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE, CUIDADOS_SERVICE } from '@app/common';
import { AuthClient, CuidadosClient } from './microservicios';

/** Clientes TCP hacia los microservicios, disponibles en todo el gateway. */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('AUTH_HOST', 'localhost'),
            port: Number(config.get('AUTH_PORT', 4001)),
          },
        }),
      },
      {
        name: CUIDADOS_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('CUIDADOS_HOST', 'localhost'),
            port: Number(config.get('CUIDADOS_PORT', 4002)),
          },
        }),
      },
    ]),
  ],
  providers: [AuthClient, CuidadosClient],
  exports: [AuthClient, CuidadosClient],
})
export class MicroserviciosModule {}
