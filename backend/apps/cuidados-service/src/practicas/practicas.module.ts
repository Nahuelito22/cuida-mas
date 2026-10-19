import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Practica, PracticaSchema } from './practica.schema';
import { PracticasController } from './practicas.controller';
import { PracticasService } from './practicas.service';
import { Enfermero, EnfermeroSchema } from '../enfermeros/enfermero.schema';
import { Solicitud, SolicitudSchema } from '../solicitudes/solicitud.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Practica.name, schema: PracticaSchema },
      // Se usan para impedir borrar una práctica que está en uso.
      { name: Enfermero.name, schema: EnfermeroSchema },
      { name: Solicitud.name, schema: SolicitudSchema },
    ]),
  ],
  controllers: [PracticasController],
  providers: [PracticasService],
  exports: [PracticasService],
})
export class PracticasModule {}
