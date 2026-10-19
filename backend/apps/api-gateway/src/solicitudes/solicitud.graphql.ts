import {
  Field,
  Float,
  ID,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EstadoSolicitud, OrigenSolicitud } from '@app/common';

registerEnumType(EstadoSolicitud, { name: 'EstadoSolicitud' });
registerEnumType(OrigenSolicitud, { name: 'OrigenSolicitud' });

@ObjectType('ZonaResumen')
export class ZonaResumen {
  @Field(() => ID)
  id: string;

  @Field()
  nombre: string;

  @Field()
  departamento: string;
}

@ObjectType('PracticaResumen')
export class PracticaResumen {
  @Field(() => ID)
  id: string;

  @Field()
  nombre: string;

  @Field(() => Int)
  duracionEstimadaMin: number;
}

@ObjectType('EnfermeroResumen')
export class EnfermeroResumen {
  @Field(() => ID)
  id: string;

  @Field()
  nombre: string;

  @Field()
  apellido: string;

  @Field()
  matricula: string;

  @Field({ nullable: true })
  telefono?: string;

  @Field(() => Float)
  puntajePromedio: number;

  @Field(() => Int)
  cantidadResenas: number;
}

@ObjectType('Solicitud', { description: 'Plan de cuidados domiciliarios' })
export class SolicitudModel {
  @Field(() => ID)
  id: string;

  @Field()
  pacienteId: string;

  @Field()
  pacienteNombre: string;

  @Field()
  creadaPorId: string;

  @Field(() => OrigenSolicitud)
  origen: OrigenSolicitud;

  @Field({ nullable: true })
  centroOrigen?: string;

  @Field(() => ZonaResumen)
  zona: ZonaResumen;

  @Field(() => [PracticaResumen])
  practicas: PracticaResumen[];

  @Field()
  direccion: string;

  @Field({ description: 'Fecha ISO 8601' })
  fechaInicio: string;

  @Field({ description: 'Fecha ISO 8601' })
  fechaFin: string;

  @Field()
  frecuencia: string;

  @Field({ nullable: true })
  observaciones?: string;

  @Field(() => EstadoSolicitud)
  estado: EstadoSolicitud;

  @Field(() => EnfermeroResumen, { nullable: true })
  enfermero?: EnfermeroResumen | null;

  @Field({ nullable: true })
  fechaAceptacion?: string;

  @Field({ nullable: true })
  fechaFinalizacion?: string;

  @Field({ nullable: true })
  motivoCancelacion?: string;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}

@InputType()
export class CrearSolicitudInput {
  @Field({
    nullable: true,
    description:
      'Solo ADMIN: paciente al que se deriva. El paciente no lo envía.',
  })
  @IsOptional()
  @IsMongoId({ message: 'Id de paciente inválido' })
  pacienteId?: string;

  @Field({ nullable: true, description: 'Solo ADMIN: centro que da el alta' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  centroOrigen?: string;

  @Field()
  @IsMongoId({ message: 'Id de zona inválido' })
  zonaId: string;

  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1, { message: 'Elegí al menos una práctica' })
  @ArrayMaxSize(20)
  @IsMongoId({ each: true, message: 'Id de práctica inválido' })
  practicaIds: string[];

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MaxLength(200)
  direccion: string;

  @Field({ description: 'Fecha ISO 8601 (ej: 2026-11-01)' })
  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  fechaInicio: string;

  @Field({ description: 'Fecha ISO 8601 (ej: 2026-11-10)' })
  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  fechaFin: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'La frecuencia es obligatoria' })
  @MaxLength(60)
  frecuencia: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}

@InputType()
export class ActualizarSolicitudInput extends PartialType(
  OmitType(CrearSolicitudInput, ['pacienteId'] as const),
) {}

@InputType()
export class FiltroSolicitudesInput {
  @Field(() => EstadoSolicitud, { nullable: true })
  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @Field({ nullable: true, description: 'Solo ADMIN' })
  @IsOptional()
  @IsMongoId()
  zonaId?: string;

  @Field({
    nullable: true,
    description: 'Solo ENFERMERO: "disponibles" o "asignadas" (por defecto)',
  })
  @IsOptional()
  @IsIn(['disponibles', 'asignadas'])
  vista?: 'disponibles' | 'asignadas';
}
