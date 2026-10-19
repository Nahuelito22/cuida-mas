import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class PerfilEnfermeroDto {
  @ApiProperty({ example: 'MP-12345' })
  @Matches(/^[A-Za-z0-9-]{3,20}$/, {
    message: 'La matrícula solo admite letras, números y guiones (3 a 20)',
  })
  matricula: string;

  @ApiPropertyOptional({ example: '2615001122' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Enfermera con 8 años en clínica médica.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ type: [String], description: 'Ids de las zonas que atiende' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Elegí al menos una zona' })
  @ArrayMaxSize(30)
  @IsMongoId({ each: true, message: 'Id de zona inválido' })
  zonaIds: string[];

  @ApiProperty({
    type: [String],
    description: 'Ids de las prácticas que realiza',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Elegí al menos una práctica' })
  @ArrayMaxSize(50)
  @IsMongoId({ each: true, message: 'Id de práctica inválido' })
  practicaIds: string[];
}

export class BuscarEnfermerosQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: 'Id de zona inválido' })
  zonaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: 'Id de práctica inválido' })
  practicaId?: string;

  @ApiPropertyOptional({ description: 'Nombre, apellido o matrícula' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;

  @ApiPropertyOptional({ description: 'Solo lo puede usar el ADMIN' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  verificado?: boolean;
}

export class VerificacionDto {
  @ApiProperty()
  @IsBoolean()
  verificado: boolean;
}
