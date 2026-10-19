import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AUTH_PATTERNS, Rol } from '@app/common';
import { AuthClient } from '../common/microservicios';
import { Roles } from '../common/decorators';

export class BuscarUsuariosQuery {
  @ApiPropertyOptional({ enum: Rol })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @ApiPropertyOptional({ description: 'Nombre, apellido, email o DNI' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;
}

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly auth: AuthClient) {}

  @Get()
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Buscar usuarios (ej: pacientes para derivar)' })
  buscar(@Query() query: BuscarUsuariosQuery) {
    return this.auth.send(AUTH_PATTERNS.BUSCAR_USUARIOS, query);
  }
}
