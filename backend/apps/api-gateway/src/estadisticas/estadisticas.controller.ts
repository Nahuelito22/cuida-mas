import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CUIDADOS_PATTERNS, Rol } from '@app/common';
import { CuidadosClient } from '../common/microservicios';
import { Public, Roles } from '../common/decorators';

@ApiTags('Estadísticas')
@Controller()
export class EstadisticasController {
  constructor(private readonly cuidados: CuidadosClient) {}

  @Get('estadisticas/cobertura')
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cobertura por zona: demanda de cuidados vs. enfermeros verificados',
  })
  cobertura() {
    return this.cuidados.send(CUIDADOS_PATTERNS.COBERTURA_POR_ZONA);
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Estado del gateway (lo usa Docker)' })
  health() {
    return { status: 'ok', servicio: 'api-gateway' };
  }
}
