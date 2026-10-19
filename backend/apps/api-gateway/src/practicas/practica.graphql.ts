import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  PartialType,
} from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@ObjectType('Practica', { description: 'Práctica de enfermería del catálogo' })
export class PracticaModel {
  @Field(() => ID)
  id: string;

  @Field()
  nombre: string;

  @Field({ nullable: true })
  descripcion?: string;

  @Field(() => Int)
  duracionEstimadaMin: number;

  @Field()
  activa: boolean;

  @Field({ description: 'Fecha ISO 8601' })
  createdAt: string;

  @Field({ description: 'Fecha ISO 8601' })
  updatedAt: string;
}

@InputType()
export class CrearPracticaInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(80)
  nombre: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;

  @Field(() => Int)
  @IsInt()
  @Min(5, { message: 'La duración mínima es de 5 minutos' })
  @Max(480, { message: 'La duración máxima es de 480 minutos' })
  duracionEstimadaMin: number;
}

@InputType()
export class ActualizarPracticaInput extends PartialType(CrearPracticaInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
