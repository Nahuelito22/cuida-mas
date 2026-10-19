import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CUIDADOS_PATTERNS } from '@app/common';
import type { UsuarioActual } from '@app/common';
import { EnfermerosService } from './enfermeros.service';
import type {
  BuscarEnfermerosFiltro,
  PerfilEnfermeroData,
} from './enfermeros.service';

@Controller()
export class EnfermerosController {
  constructor(private readonly enfermerosService: EnfermerosService) {}

  @MessagePattern(CUIDADOS_PATTERNS.ENFERMERO_GUARDAR_PERFIL)
  guardarPerfil(
    @Payload() data: { usuario: UsuarioActual; perfil: PerfilEnfermeroData },
  ) {
    return this.enfermerosService.guardarPerfil(data.usuario, data.perfil);
  }

  @MessagePattern(CUIDADOS_PATTERNS.ENFERMERO_MI_PERFIL)
  miPerfil(@Payload() data: { usuarioId: string }) {
    return this.enfermerosService.miPerfil(data.usuarioId);
  }

  @MessagePattern(CUIDADOS_PATTERNS.ENFERMERO_OBTENER)
  obtener(@Payload() data: { id: string }) {
    return this.enfermerosService.obtener(data.id);
  }

  @MessagePattern(CUIDADOS_PATTERNS.ENFERMERO_BUSCAR)
  buscar(@Payload() filtro: BuscarEnfermerosFiltro) {
    return this.enfermerosService.buscar(filtro ?? {});
  }

  @MessagePattern(CUIDADOS_PATTERNS.ENFERMERO_VERIFICAR)
  verificar(@Payload() data: { id: string; verificado: boolean }) {
    return this.enfermerosService.verificar(data.id, data.verificado);
  }
}
