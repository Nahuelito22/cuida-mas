import { BadRequestException } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AUTH_PATTERNS, CUIDADOS_PATTERNS, Rol } from '@app/common';
import type { UsuarioActual as UsuarioActualData } from '@app/common';
import { AuthClient, CuidadosClient } from '../common/microservicios';
import { Roles, UsuarioActual } from '../common/decorators';
import {
  ActualizarSolicitudInput,
  CrearSolicitudInput,
  FiltroSolicitudesInput,
  SolicitudModel,
} from './solicitud.graphql';

interface UsuarioAuth {
  id: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

/**
 * CRUD GraphQL #2: solicitudes (planes de cuidado).
 * Qué solicitudes ve cada uno lo decide cuidados-service según el rol.
 */
@Resolver(() => SolicitudModel)
export class SolicitudesResolver {
  constructor(
    private readonly cuidados: CuidadosClient,
    private readonly auth: AuthClient,
  ) {}

  @Query(() => [SolicitudModel], { description: 'Listar solicitudes visibles' })
  solicitudes(
    @UsuarioActual() usuario: UsuarioActualData,
    @Args('filtro', { nullable: true }) filtro?: FiltroSolicitudesInput,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_LISTAR, {
      usuario,
      filtro: filtro ?? {},
    });
  }

  @Query(() => SolicitudModel)
  solicitud(
    @UsuarioActual() usuario: UsuarioActualData,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_OBTENER, {
      usuario,
      id,
    });
  }

  @Mutation(() => SolicitudModel, {
    description:
      'PACIENTE: pide cuidados para sí mismo. ADMIN: deriva a un paciente (pacienteId).',
  })
  @Roles(Rol.PACIENTE, Rol.ADMIN)
  async crearSolicitud(
    @UsuarioActual() usuario: UsuarioActualData,
    @Args('input') input: CrearSolicitudInput,
  ) {
    let pacienteNombre: string | undefined;
    if (usuario.rol === Rol.ADMIN) {
      // El gateway combina datos de los dos servicios: valida al paciente en auth-service.
      if (!input.pacienteId) {
        throw new BadRequestException(
          'Para derivar hay que indicar el paciente',
        );
      }
      const paciente = await this.auth.send<UsuarioAuth>(AUTH_PATTERNS.PERFIL, {
        id: input.pacienteId,
      });
      if (paciente.rol !== Rol.PACIENTE) {
        throw new BadRequestException('El usuario indicado no es un paciente');
      }
      pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
    }

    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_CREAR, {
      usuario,
      solicitud: {
        ...input,
        pacienteId: usuario.rol === Rol.ADMIN ? input.pacienteId : undefined,
        pacienteNombre,
      },
    });
  }

  @Mutation(() => SolicitudModel, {
    description: 'Modificar una solicitud pendiente',
  })
  @Roles(Rol.PACIENTE, Rol.ADMIN)
  actualizarSolicitud(
    @UsuarioActual() usuario: UsuarioActualData,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ActualizarSolicitudInput,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_ACTUALIZAR, {
      usuario,
      id,
      cambios: input,
    });
  }

  @Mutation(() => SolicitudModel, {
    description: 'Eliminar una solicitud pendiente o cancelada',
  })
  @Roles(Rol.PACIENTE, Rol.ADMIN)
  eliminarSolicitud(
    @UsuarioActual() usuario: UsuarioActualData,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.SOLICITUD_ELIMINAR, {
      usuario,
      id,
    });
  }
}
