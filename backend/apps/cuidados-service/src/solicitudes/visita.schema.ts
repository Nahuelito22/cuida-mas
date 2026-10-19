import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { opcionesEsquema } from '@app/common';
import { Enfermero } from '../enfermeros/enfermero.schema';
import { Practica } from '../practicas/practica.schema';
import { Solicitud } from './solicitud.schema';

export type VisitaDocument = HydratedDocument<Visita>;

/** Entrada de la bitácora: lo que hizo el enfermero en cada visita al domicilio. */
@Schema(opcionesEsquema('visitas'))
export class Visita {
  @Prop({ type: Types.ObjectId, ref: Solicitud.name, required: true })
  solicitud: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Enfermero.name, required: true })
  enfermero: Types.ObjectId;

  @Prop({ required: true })
  fecha: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: Practica.name }], default: [] })
  practicasRealizadas: Types.ObjectId[];

  @Prop({
    required: [true, 'Las observaciones son obligatorias'],
    trim: true,
    maxlength: 1000,
  })
  observaciones: string;

  /** Controles opcionales tomados en la visita. */
  @Prop({
    trim: true,
    match: [/^\d{2,3}\/\d{2,3}$/, 'Formato de presión: 120/80'],
  })
  presionArterial?: string;

  @Prop({ min: 30, max: 45 })
  temperatura?: number;
}

export const VisitaSchema = SchemaFactory.createForClass(Visita);

VisitaSchema.index({ solicitud: 1, fecha: -1 });
