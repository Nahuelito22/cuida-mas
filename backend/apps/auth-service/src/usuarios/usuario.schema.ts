import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { opcionesEsquema, Rol } from '@app/common';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema(opcionesEsquema('usuarios'))
export class Usuario {
  @Prop({
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'El email no tiene un formato válido',
    ],
  })
  email: string;

  /** Nunca se devuelve en las consultas salvo que se pida explícitamente. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: [true, 'El nombre es obligatorio'], trim: true })
  nombre: string;

  @Prop({ required: [true, 'El apellido es obligatorio'], trim: true })
  apellido: string;

  @Prop({
    required: [true, 'El DNI es obligatorio'],
    unique: true,
    trim: true,
    match: [/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos'],
  })
  dni: string;

  @Prop({ trim: true })
  telefono?: string;

  @Prop({ type: String, enum: Object.values(Rol), default: Rol.PACIENTE })
  rol: Rol;

  @Prop({ default: true })
  activo: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// Búsqueda de pacientes por nombre/apellido desde el panel del centro de salud.
UsuarioSchema.index({ apellido: 1, nombre: 1 });
