import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { opcionesEsquema } from '@app/common';

export type ZonaDocument = HydratedDocument<Zona>;

/** Zona de cobertura (barrio o distrito) dentro de un departamento de Mendoza. */
@Schema(opcionesEsquema('zonas'))
export class Zona {
  @Prop({
    required: [true, 'El nombre es obligatorio'],
    unique: true,
    trim: true,
  })
  nombre: string;

  @Prop({ required: [true, 'El departamento es obligatorio'], trim: true })
  departamento: string;
}

export const ZonaSchema = SchemaFactory.createForClass(Zona);
