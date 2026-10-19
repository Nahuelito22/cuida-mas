import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { opcionesEsquema } from '@app/common';

export type PracticaDocument = HydratedDocument<Practica>;

/** Catálogo de prácticas de enfermería domiciliaria (curación, inyectable, etc.). */
@Schema(opcionesEsquema('practicas'))
export class Practica {
  @Prop({
    required: [true, 'El nombre es obligatorio'],
    unique: true,
    trim: true,
    maxlength: [80, 'El nombre no puede superar los 80 caracteres'],
  })
  nombre: string;

  @Prop({ trim: true, maxlength: 300 })
  descripcion?: string;

  @Prop({
    required: [true, 'La duración estimada es obligatoria'],
    min: [5, 'La duración mínima es de 5 minutos'],
    max: [480, 'La duración máxima es de 480 minutos'],
  })
  duracionEstimadaMin: number;

  /** Las prácticas en uso no se borran: se desactivan. */
  @Prop({ default: true })
  activa: boolean;
}

export const PracticaSchema = SchemaFactory.createForClass(Practica);
