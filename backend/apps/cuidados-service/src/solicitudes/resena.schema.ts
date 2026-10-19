import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { opcionesEsquema } from '@app/common';
import { Enfermero } from '../enfermeros/enfermero.schema';
import { Solicitud } from './solicitud.schema';

export type ResenaDocument = HydratedDocument<Resena>;

/** Calificación que deja el paciente al finalizar un plan de cuidados. */
@Schema(opcionesEsquema('resenas'))
export class Resena {
  /** Una sola reseña por solicitud. */
  @Prop({
    type: Types.ObjectId,
    ref: Solicitud.name,
    required: true,
    unique: true,
  })
  solicitud: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Enfermero.name, required: true })
  enfermero: Types.ObjectId;

  @Prop({ required: true })
  pacienteId: string;

  @Prop({ required: true, trim: true })
  pacienteNombre: string;

  @Prop({
    required: [true, 'El puntaje es obligatorio'],
    min: [1, 'El puntaje mínimo es 1'],
    max: [5, 'El puntaje máximo es 5'],
  })
  puntaje: number;

  @Prop({ trim: true, maxlength: 500 })
  comentario?: string;
}

export const ResenaSchema = SchemaFactory.createForClass(Resena);

ResenaSchema.index({ enfermero: 1, createdAt: -1 });
