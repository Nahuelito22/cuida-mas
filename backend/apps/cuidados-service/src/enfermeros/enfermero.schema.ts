import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { opcionesEsquema } from '@app/common';
import { Practica } from '../practicas/practica.schema';
import { Zona } from '../zonas/zona.schema';

export type EnfermeroDocument = HydratedDocument<Enfermero>;

/**
 * Perfil profesional de un usuario con rol ENFERMERO.
 * Relaciones muchos-a-muchos: un enfermero realiza muchas prácticas y atiende
 * muchas zonas; cada práctica/zona la cubren muchos enfermeros.
 */
@Schema(opcionesEsquema('enfermeros'))
export class Enfermero {
  /** Id del usuario en auth-service (otra base de datos, por eso no es ref). */
  @Prop({ required: true, unique: true })
  usuarioId: string;

  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  @Prop({
    required: [true, 'La matrícula es obligatoria'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-]{3,20}$/, 'La matrícula no tiene un formato válido'],
  })
  matricula: string;

  @Prop({ trim: true })
  telefono?: string;

  @Prop({ trim: true, maxlength: [500, 'La presentación es muy larga'] })
  bio?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: Zona.name }], default: [] })
  zonas: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: Practica.name }], default: [] })
  practicas: Types.ObjectId[];

  /** Lo marca el centro de salud después de controlar la matrícula. */
  @Prop({ default: false })
  verificado: boolean;

  @Prop({ default: 0 })
  puntajePromedio: number;

  @Prop({ default: 0 })
  cantidadResenas: number;
}

export const EnfermeroSchema = SchemaFactory.createForClass(Enfermero);

// MongoDB no permite un índice compuesto sobre dos arrays, por eso van separados.
EnfermeroSchema.index({ zonas: 1, verificado: 1 });
EnfermeroSchema.index({ practicas: 1 });
