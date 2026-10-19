import type { DatosRegistro, DatosSolicitud } from '../api/servicios'

export type Errores<T> = Partial<Record<keyof T, string>>

export function validarRegistro(d: DatosRegistro): Errores<DatosRegistro> {
  const e: Errores<DatosRegistro> = {}
  if (!d.nombre.trim()) e.nombre = 'Obligatorio'
  if (!d.apellido.trim()) e.apellido = 'Obligatorio'
  if (!/^\d{7,8}$/.test(d.dni)) e.dni = 'El DNI debe tener 7 u 8 dígitos, sin puntos'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Email inválido'
  if (d.password.length < 8) e.password = 'Mínimo 8 caracteres'
  return e
}

export function validarSolicitud(d: DatosSolicitud): Errores<DatosSolicitud> {
  const e: Errores<DatosSolicitud> = {}
  if (!d.zonaId) e.zonaId = 'Elegí la zona del domicilio'
  if (!d.practicaIds.length) e.practicaIds = 'Elegí al menos una práctica'
  if (!d.direccion.trim()) e.direccion = 'La dirección es obligatoria'
  if (!d.fechaInicio) e.fechaInicio = 'Indicá la fecha de inicio'
  if (!d.fechaFin) e.fechaFin = 'Indicá la fecha de fin'
  else if (d.fechaInicio && d.fechaFin < d.fechaInicio) e.fechaFin = 'Debe ser posterior al inicio'
  if (!d.frecuencia.trim()) e.frecuencia = 'Indicá la frecuencia'
  return e
}

/** true si el JWT ya venció (se lee el campo `exp` del payload). */
export function tokenVencido(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number }
    return !payload.exp || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}
