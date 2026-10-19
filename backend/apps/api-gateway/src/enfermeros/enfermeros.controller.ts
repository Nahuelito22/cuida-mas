import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CUIDADOS_PATTERNS, Rol } from '@app/common';
import type { UsuarioActual as UsuarioActualData } from '@app/common';
import { CuidadosClient } from '../common/microservicios';
import { Roles, UsuarioActual } from '../common/decorators';
import {
  BuscarEnfermerosQuery,
  PerfilEnfermeroDto,
  VerificacionDto,
} from './enfermeros.dto';

@ApiTags('Enfermeros')
@ApiBearerAuth()
@Controller('enfermeros')
export class EnfermerosController {
  constructor(private readonly cuidados: CuidadosClient) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar enfermeros por zona, práctica o nombre',
    description: 'Pacientes y enfermeros solo ven perfiles verificados.',
  })
  buscar(
    @Query() query: BuscarEnfermerosQuery,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    const verificado = usuario.rol === Rol.ADMIN ? query.verificado : true;
    return this.cuidados.send(CUIDADOS_PATTERNS.ENFERMERO_BUSCAR, {
      ...query,
      verificado,
    });
  }

  @Get('mi-perfil')
  @Roles(Rol.ENFERMERO)
  @ApiOperation({ summary: 'Perfil profesional del enfermero logueado' })
  miPerfil(@UsuarioActual() usuario: UsuarioActualData) {
    return this.cuidados.send(CUIDADOS_PATTERNS.ENFERMERO_MI_PERFIL, {
      usuarioId: usuario.id,
    });
  }

  @Put('mi-perfil')
  @Roles(Rol.ENFERMERO)
  @ApiOperation({ summary: 'Crear o actualizar el perfil profesional' })
  guardarPerfil(
    @Body() dto: PerfilEnfermeroDto,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.ENFERMERO_GUARDAR_PERFIL, {
      usuario,
      perfil: dto,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un enfermero' })
  obtener(@Param('id') id: string) {
    return this.cuidados.send(CUIDADOS_PATTERNS.ENFERMERO_OBTENER, { id });
  }

  @Get(':id/resenas')
  @ApiOperation({ summary: 'Reseñas recibidas por un enfermero' })
  resenas(@Param('id') id: string) {
    return this.cuidados.send(CUIDADOS_PATTERNS.RESENA_LISTAR_POR_ENFERMERO, {
      enfermeroId: id,
    });
  }

  @Patch(':id/verificacion')
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Marcar la matrícula como verificada (o quitarla)' })
  verificar(@Param('id') id: string, @Body() dto: VerificacionDto) {
    return this.cuidados.send(CUIDADOS_PATTERNS.ENFERMERO_VERIFICAR, {
      id,
      verificado: dto.verificado,
    });
  }
}
