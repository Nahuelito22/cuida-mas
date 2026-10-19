import { EstadoSolicitud, puedeTransicionar } from './enums';

describe('Máquina de estados de la solicitud', () => {
  it.each([
    [EstadoSolicitud.PENDIENTE, EstadoSolicitud.ACEPTADA],
    [EstadoSolicitud.PENDIENTE, EstadoSolicitud.CANCELADA],
    [EstadoSolicitud.ACEPTADA, EstadoSolicitud.EN_CURSO],
    [EstadoSolicitud.ACEPTADA, EstadoSolicitud.CANCELADA],
    [EstadoSolicitud.EN_CURSO, EstadoSolicitud.FINALIZADA],
  ])('permite %s → %s', (desde, hacia) => {
    expect(puedeTransicionar(desde, hacia)).toBe(true);
  });

  it.each([
    [EstadoSolicitud.PENDIENTE, EstadoSolicitud.FINALIZADA],
    [EstadoSolicitud.EN_CURSO, EstadoSolicitud.CANCELADA],
    [EstadoSolicitud.FINALIZADA, EstadoSolicitud.PENDIENTE],
    [EstadoSolicitud.CANCELADA, EstadoSolicitud.ACEPTADA],
  ])('impide %s → %s', (desde, hacia) => {
    expect(puedeTransicionar(desde, hacia)).toBe(false);
  });
});
