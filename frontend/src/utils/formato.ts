const fecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const fechaHora = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** 2026-11-01T00:00:00Z → 01/11/2026 (las fechas de un plan se guardan en UTC). */
export function formatearFecha(iso?: string | null): string {
  return iso ? fecha.format(new Date(iso)) : '-'
}

/** Fecha y hora local, para las visitas de la bitácora. */
export function formatearFechaHora(iso?: string | null): string {
  return iso ? fechaHora.format(new Date(iso)) : '-'
}

/** Valor para un <input type="date"> a partir de una fecha ISO. */
export function aInputFecha(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export function hoyInputFecha(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nombreCompleto(p: { nombre: string; apellido: string }): string {
  return `${p.nombre} ${p.apellido}`
}
