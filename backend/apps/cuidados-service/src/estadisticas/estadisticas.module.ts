import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { Zona, ZonaSchema } from '../zonas/zona.schema';
import { Enfermero, EnfermeroSchema } from '../enfermeros/enfermero.schema';
import { Solicitud, SolicitudSchema } from '../solicitudes/solicitud.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Zona.name, schema: ZonaSchema },
      { name: Enfermero.name, schema: EnfermeroSchema },
      { name: Solicitud.name, schema: SolicitudSchema },
    ]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
