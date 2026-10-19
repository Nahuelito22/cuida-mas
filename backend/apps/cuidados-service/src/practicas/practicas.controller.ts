import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CUIDADOS_PATTERNS } from '@app/common';
import { PracticasService } from './practicas.service';
import type { PracticaData } from './practicas.service';

@Controller()
export class PracticasController {
  constructor(private readonly practicasService: PracticasService) {}

  @MessagePattern(CUIDADOS_PATTERNS.PRACTICA_CREAR)
  crear(@Payload() data: PracticaData) {
    return this.practicasService.crear(data);
  }

  @MessagePattern(CUIDADOS_PATTERNS.PRACTICA_LISTAR)
  listar(@Payload() filtro: { soloActivas?: boolean }) {
    return this.practicasService.listar(filtro ?? {});
  }

  @MessagePattern(CUIDADOS_PATTERNS.PRACTICA_OBTENER)
  obtener(@Payload() data: { id: string }) {
    return this.practicasService.obtener(data.id);
  }

  @MessagePattern(CUIDADOS_PATTERNS.PRACTICA_ACTUALIZAR)
  actualizar(@Payload() data: { id: string; cambios: Partial<PracticaData> }) {
    return this.practicasService.actualizar(data.id, data.cambios);
  }

  @MessagePattern(CUIDADOS_PATTERNS.PRACTICA_ELIMINAR)
  eliminar(@Payload() data: { id: string }) {
    return this.practicasService.eliminar(data.id);
  }
}
