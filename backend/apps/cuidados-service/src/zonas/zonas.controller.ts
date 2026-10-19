import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CUIDADOS_PATTERNS } from '@app/common';
import { ZonasService } from './zonas.service';
import type { ZonaData } from './zonas.service';

@Controller()
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @MessagePattern(CUIDADOS_PATTERNS.ZONA_CREAR)
  crear(@Payload() data: ZonaData) {
    return this.zonasService.crear(data);
  }

  @MessagePattern(CUIDADOS_PATTERNS.ZONA_LISTAR)
  listar() {
    return this.zonasService.listar();
  }
}
