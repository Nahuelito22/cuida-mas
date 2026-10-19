import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { RpcLoggingInterceptor } from '@app/common';
import { EnfermerosModule } from './enfermeros/enfermeros.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { PracticasModule } from './practicas/practicas.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { ZonasModule } from './zonas/zonas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'CUIDADOS_MONGO_URI',
          'mongodb://localhost:27030/cuidamas_cuidados',
        ),
      }),
    }),
    PracticasModule,
    ZonasModule,
    EnfermerosModule,
    SolicitudesModule,
    EstadisticasModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RpcLoggingInterceptor }],
})
export class CuidadosServiceModule {}
