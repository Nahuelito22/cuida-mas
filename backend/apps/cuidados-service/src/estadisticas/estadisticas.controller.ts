import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CUIDADOS_PATTERNS } from '@app/common';
import { EstadisticasService } from './estadisticas.service';

@Controller()
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @MessagePattern(CUIDADOS_PATTERNS.COBERTURA_POR_ZONA)
  coberturaPorZona() {
    return this.estadisticasService.coberturaPorZona();
  }
}
