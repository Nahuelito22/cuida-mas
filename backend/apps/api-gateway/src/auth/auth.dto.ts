import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Rol } from '@app/common';

export class RegistroDto {
  @ApiProperty({ example: 'laura.gomez@mail.com' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @MaxLength(120)
  email: string;

  @ApiProperty({ example: 'ClaveSegura123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(64)
  password: string;

  @ApiProperty({ example: 'Laura' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(60)
  nombre: string;

  @ApiProperty({ example: 'Gómez' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(60)
  apellido: string;

  @ApiProperty({
    example: '30111222',
    description: '7 u 8 dígitos, sin puntos',
  })
  @Matches(/^\d{7,8}$/, { message: 'El DNI debe tener 7 u 8 dígitos' })
  dni: string;

  @ApiPropertyOptional({ example: '2614556677' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({
    enum: [Rol.PACIENTE, Rol.ENFERMERO],
    default: Rol.PACIENTE,
  })
  @IsOptional()
  @IsIn([Rol.PACIENTE, Rol.ENFERMERO], {
    message: 'Solo podés registrarte como PACIENTE o ENFERMERO',
  })
  rol?: Rol;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@cuidamas.com' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;

  @ApiProperty({ example: 'Admin1234' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
