import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CUIDADOS_PATTERNS, Rol } from '@app/common';
import { CuidadosClient } from '../common/microservicios';
import { Public, Roles } from '../common/decorators';

export class CrearZonaDto {
  @ApiProperty({ example: 'El Algarrobal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre: string;

  @ApiProperty({ example: 'Las Heras' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  departamento: string;
}

@ApiTags('Zonas')
@Controller('zonas')
export class ZonasController {
  constructor(private readonly cuidados: CuidadosClient) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar zonas de cobertura' })
  listar() {
    return this.cuidados.send(CUIDADOS_PATTERNS.ZONA_LISTAR);
  }

  @Post()
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una zona' })
  crear(@Body() dto: CrearZonaDto) {
    return this.cuidados.send(CUIDADOS_PATTERNS.ZONA_CREAR, dto);
  }
}
