import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CUIDADOS_PATTERNS, Rol } from '@app/common';
import type { UsuarioActual as UsuarioActualData } from '@app/common';
import { CuidadosClient } from '../common/microservicios';
import { Roles, UsuarioActual } from '../common/decorators';
import {
  CancelarSolicitudDto,
  CrearResenaDto,
  RegistrarVisitaDto,
} from './solicitudes.dto';

/**
 * Acciones del flujo de una solicitud (el CRUD está en GraphQL).
 * PENDIENTE → ACEPTADA → EN_CURSO (primera visita) → FINALIZADA, o CANCELADA.
 */
@ApiTags('Solicitudes (flujo)')
@ApiBearerAuth()
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly cuidados: CuidadosClient) {}

  @Post(':id/aceptar')
  @HttpCode(200)
  @Roles(Rol.ENFERMERO)
  @ApiOperation({ summary: 'El enfermero toma una solicitud pendiente' })
  aceptar(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_ACEPTAR, {
      usuario,
      id,
    });
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  @Roles(Rol.PACIENTE, Rol.ADMIN)
  @ApiOperation({ summary: 'Cancelar una solicitud pendiente o aceptada' })
  cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarSolicitudDto,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_CANCELAR, {
      usuario,
      id,
      motivo: dto.motivo,
    });
  }

  @Post(':id/finalizar')
  @HttpCode(200)
  @Roles(Rol.ENFERMERO, Rol.ADMIN)
  @ApiOperation({ summary: 'Dar por terminado el plan de cuidados' })
  finalizar(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_FINALIZAR, {
      usuario,
      id,
    });
  }

  @Get(':id/visitas')
  @ApiOperation({ summary: 'Bitácora de visitas de la solicitud' })
  visitas(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.VISITA_LISTAR, {
      usuario,
      solicitudId: id,
    });
  }

  @Post(':id/visitas')
  @Roles(Rol.ENFERMERO)
  @ApiOperation({ summary: 'Registrar una visita en la bitácora' })
  registrarVisita(
    @Param('id') id: string,
    @Body() dto: RegistrarVisitaDto,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.VISITA_REGISTRAR, {
      usuario,
      solicitudId: id,
      visita: dto,
    });
  }

  @Post(':id/resena')
  @Roles(Rol.PACIENTE)
  @ApiOperation({ summary: 'Calificar al enfermero al finalizar' })
  resena(
    @Param('id') id: string,
    @Body() dto: CrearResenaDto,
    @UsuarioActual() usuario: UsuarioActualData,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.RESENA_CREAR, {
      usuario,
      solicitudId: id,
      resena: dto,
    });
  }
}
