import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enfermero, EnfermeroSchema } from './enfermero.schema';
import { EnfermerosController } from './enfermeros.controller';
import { EnfermerosService } from './enfermeros.service';
import { PracticasModule } from '../practicas/practicas.module';
import { ZonasModule } from '../zonas/zonas.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enfermero.name, schema: EnfermeroSchema },
    ]),
    PracticasModule,
    ZonasModule,
  ],
  controllers: [EnfermerosController],
  providers: [EnfermerosService],
  exports: [EnfermerosService],
})
export class EnfermerosModule {}
