import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CUIDADOS_PATTERNS } from '@app/common';
import type { UsuarioActual } from '@app/common';
import { SolicitudesService } from './solicitudes.service';
import type { SolicitudData, SolicitudFiltro } from './solicitudes.service';
import { VisitasService } from './visitas.service';
import type { VisitaData } from './visitas.service';
import { ResenasService } from './resenas.service';
import type { ResenaData } from './resenas.service';

interface ConUsuario {
  usuario: UsuarioActual;
}

@Controller()
export class SolicitudesController {
  constructor(
    private readonly solicitudesService: SolicitudesService,
    private readonly visitasService: VisitasService,
    private readonly resenasService: ResenasService,
  ) {}

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_CREAR)
  crear(@Payload() data: ConUsuario & { solicitud: SolicitudData }) {
    return this.solicitudesService.crear(data.usuario, data.solicitud);
  }

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_LISTAR)
  listar(@Payload() data: ConUsuario & { filtro?: SolicitudFiltro }) {
    return this.solicitudesService.listar(data.usuario, data.filtro);
  }

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_OBTENER)
  obtener(@Payload() data: ConUsuario & { id: string }) {
    return this.solicitudesService.obtener(data.usuario, data.id);
  }

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_ACTUALIZAR)
  actualizar(
    @Payload()
    data: ConUsuario & { id: string; cambios: Partial<SolicitudData> },
  ) {
    return this.solicitudesService.actualizar(
      data.usuario,
      data.id,
      data.cambios,
    );
  }

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_ELIMINAR)
  eliminar(@Payload() data: ConUsuario & { id: string }) {
    return this.solicitudesService.eliminar(data.usuario, data.id);
  }

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_ACEPTAR)
  aceptar(@Payload() data: ConUsuario & { id: string }) {
    return this.solicitudesService.aceptar(data.usuario, data.id);
  }

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_CANCELAR)
  cancelar(@Payload() data: ConUsuario & { id: string; motivo?: string }) {
    return this.solicitudesService.cancelar(data.usuario, data.id, data.motivo);
  }

  @MessagePattern(CUIDADOS_PATTERNS.SOLICITUD_FINALIZAR)
  finalizar(@Payload() data: ConUsuario & { id: string }) {
    return this.solicitudesService.finalizar(data.usuario, data.id);
  }

  @MessagePattern(CUIDADOS_PATTERNS.VISITA_REGISTRAR)
  registrarVisita(
    @Payload() data: ConUsuario & { solicitudId: string; visita: VisitaData },
  ) {
    return this.visitasService.registrar(
      data.usuario,
      data.solicitudId,
      data.visita,
    );
  }

  @MessagePattern(CUIDADOS_PATTERNS.VISITA_LISTAR)
  listarVisitas(@Payload() data: ConUsuario & { solicitudId: string }) {
    return this.visitasService.listar(data.usuario, data.solicitudId);
  }

  @MessagePattern(CUIDADOS_PATTERNS.RESENA_CREAR)
  crearResena(
    @Payload() data: ConUsuario & { solicitudId: string; resena: ResenaData },
  ) {
    return this.resenasService.crear(
      data.usuario,
      data.solicitudId,
      data.resena,
    );
  }

  @MessagePattern(CUIDADOS_PATTERNS.RESENA_LISTAR_POR_ENFERMERO)
  listarResenas(@Payload() data: { enfermeroId: string }) {
    return this.resenasService.listarPorEnfermero(data.enfermeroId);
  }
}
