import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CancelarSolicitudDto {
  @ApiPropertyOptional({ example: 'El paciente fue reinternado' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}

export class RegistrarVisitaDto {
  @ApiPropertyOptional({
    description: 'Fecha ISO 8601. Si se omite, se usa la fecha actual.',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha no es válida' })
  fecha?: string;

  @ApiPropertyOptional({ type: [String], description: 'Prácticas realizadas' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsMongoId({ each: true, message: 'Id de práctica inválido' })
  practicaIds?: string[];

  @ApiProperty({
    example: 'Herida con buena evolución, sin signos de infección.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Las observaciones son obligatorias' })
  @MaxLength(1000)
  observaciones: string;

  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @Matches(/^\d{2,3}\/\d{2,3}$/, { message: 'Formato de presión: 120/80' })
  presionArterial?: string;

  @ApiPropertyOptional({ example: 36.5 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperatura?: number;
}

export class CrearResenaDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  puntaje: number;

  @ApiPropertyOptional({ example: 'Muy puntual y cuidadosa.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
