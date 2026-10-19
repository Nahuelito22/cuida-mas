import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Solicitud, SolicitudSchema } from './solicitud.schema';
import { Visita, VisitaSchema } from './visita.schema';
import { Resena, ResenaSchema } from './resena.schema';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';
import { VisitasService } from './visitas.service';
import { ResenasService } from './resenas.service';
import { EnfermerosModule } from '../enfermeros/enfermeros.module';
import { PracticasModule } from '../practicas/practicas.module';
import { ZonasModule } from '../zonas/zonas.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Solicitud.name, schema: SolicitudSchema },
      { name: Visita.name, schema: VisitaSchema },
      { name: Resena.name, schema: ResenaSchema },
    ]),
    EnfermerosModule,
    PracticasModule,
    ZonasModule,
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService, VisitasService, ResenasService],
})
export class SolicitudesModule {}
