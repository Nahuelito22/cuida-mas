import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EstadoSolicitud, OrigenSolicitud, opcionesEsquema } from '@app/common';
import { Enfermero } from '../enfermeros/enfermero.schema';
import { Practica } from '../practicas/practica.schema';
import { Zona } from '../zonas/zona.schema';

export type SolicitudDocument = HydratedDocument<Solicitud>;

/** Plan de cuidados domiciliarios para un paciente. */
@Schema(opcionesEsquema('solicitudes'))
export class Solicitud {
  /** Id del paciente en auth-service. */
  @Prop({ required: true })
  pacienteId: string;

  /** Copia del nombre para mostrarlo sin consultar a otro servicio. */
  @Prop({ required: true, trim: true })
  pacienteNombre: string;

  @Prop({ required: true })
  creadaPorId: string;

  @Prop({
    type: String,
    enum: Object.values(OrigenSolicitud),
    required: true,
  })
  origen: OrigenSolicitud;

  /** Centro que dio el alta (solo en derivaciones). */
  @Prop({ trim: true })
  centroOrigen?: string;

  @Prop({ type: Types.ObjectId, ref: Zona.name, required: true })
  zona: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Practica.name }],
    validate: {
      validator: (v: unknown[]) => Array.isArray(v) && v.length > 0,
      message: 'Debe indicar al menos una práctica',
    },
  })
  practicas: Types.ObjectId[];

  @Prop({ required: [true, 'La dirección es obligatoria'], trim: true })
  direccion: string;

  @Prop({ required: [true, 'La fecha de inicio es obligatoria'] })
  fechaInicio: Date;

  @Prop({ required: [true, 'La fecha de fin es obligatoria'] })
  fechaFin: Date;

  /** Texto libre: "Diaria", "Cada 12 horas", "Lunes y jueves"... */
  @Prop({ required: [true, 'La frecuencia es obligatoria'], trim: true })
  frecuencia: string;

  @Prop({ trim: true, maxlength: 1000 })
  observaciones?: string;

  @Prop({
    type: String,
    enum: Object.values(EstadoSolicitud),
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @Prop({ type: Types.ObjectId, ref: Enfermero.name, default: null })
  enfermero: Types.ObjectId | null;

  @Prop()
  fechaAceptacion?: Date;

  @Prop()
  fechaFinalizacion?: Date;

  @Prop({ trim: true })
  motivoCancelacion?: string;
}

export const SolicitudSchema = SchemaFactory.createForClass(Solicitud);

SolicitudSchema.index({ estado: 1, zona: 1 });
SolicitudSchema.index({ pacienteId: 1, createdAt: -1 });
SolicitudSchema.index({ enfermero: 1, estado: 1 });
