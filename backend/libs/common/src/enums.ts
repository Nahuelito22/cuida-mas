export enum Rol {
  ADMIN = 'ADMIN',
  ENFERMERO = 'ENFERMERO',
  PACIENTE = 'PACIENTE',
}

export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  EN_CURSO = 'EN_CURSO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export enum OrigenSolicitud {
  /** El centro de salud deriva al paciente al dar el alta. */
  DERIVACION = 'DERIVACION',
  /** El paciente o su familiar pide el cuidado por su cuenta. */
  PARTICULAR = 'PARTICULAR',
}

/** Máquina de estados de una solicitud: desde cada estado, a cuáles se puede pasar. */
export const TRANSICIONES_SOLICITUD: Record<
  EstadoSolicitud,
  EstadoSolicitud[]
> = {
  [EstadoSolicitud.PENDIENTE]: [
    EstadoSolicitud.ACEPTADA,
    EstadoSolicitud.CANCELADA,
  ],
  [EstadoSolicitud.ACEPTADA]: [
    EstadoSolicitud.EN_CURSO,
    EstadoSolicitud.CANCELADA,
  ],
  [EstadoSolicitud.EN_CURSO]: [EstadoSolicitud.FINALIZADA],
  [EstadoSolicitud.FINALIZADA]: [],
  [EstadoSolicitud.CANCELADA]: [],
};

export function puedeTransicionar(
  desde: EstadoSolicitud,
  hacia: EstadoSolicitud,
): boolean {
  return TRANSICIONES_SOLICITUD[desde].includes(hacia);
}
