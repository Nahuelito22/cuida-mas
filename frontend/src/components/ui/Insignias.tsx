import type { ReactNode } from 'react'
import type { EstadoSolicitud, NivelCobertura } from '../../types'

type Color = 'gris' | 'verde' | 'azul' | 'ambar' | 'rojo' | 'violeta'

const COLORES: Record<Color, string> = {
  gris: 'bg-slate-100 text-slate-700 ring-slate-200',
  verde: 'bg-brand-50 text-brand-700 ring-brand-200',
  azul: 'bg-sky-50 text-sky-700 ring-sky-200',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-200',
  rojo: 'bg-red-50 text-red-700 ring-red-200',
  violeta: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export function Insignia({ color = 'gris', children }: { color?: Color; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORES[color]}`}>
      {children}
    </span>
  )
}

const ESTADOS: Record<EstadoSolicitud, { texto: string; color: Color }> = {
  PENDIENTE: { texto: 'Pendiente', color: 'ambar' },
  ACEPTADA: { texto: 'Aceptada', color: 'azul' },
  EN_CURSO: { texto: 'En curso', color: 'violeta' },
  FINALIZADA: { texto: 'Finalizada', color: 'verde' },
  CANCELADA: { texto: 'Cancelada', color: 'gris' },
}

export function InsigniaEstado({ estado }: { estado: EstadoSolicitud }) {
  const { texto, color } = ESTADOS[estado]
  return <Insignia color={color}>{texto}</Insignia>
}

const NIVELES: Record<NivelCobertura, { texto: string; color: Color }> = {
  CRITICA: { texto: 'Crítica', color: 'rojo' },
  BAJA: { texto: 'Baja', color: 'ambar' },
  ADECUADA: { texto: 'Adecuada', color: 'verde' },
  SIN_DEMANDA: { texto: 'Sin demanda', color: 'gris' },
}

export function InsigniaCobertura({ nivel }: { nivel: NivelCobertura }) {
  const { texto, color } = NIVELES[nivel]
  return <Insignia color={color}>{texto}</Insignia>
}

export function Estrellas({ puntaje, cantidad }: { puntaje: number; cantidad?: number }) {
  if (!cantidad && cantidad !== undefined) {
    return <span className="text-xs text-slate-400">Sin reseñas</span>
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`${puntaje} de 5 estrellas`}>
      <span className="text-amber-500" aria-hidden="true">
        {'★'.repeat(Math.round(puntaje))}
        <span className="text-slate-300">{'★'.repeat(5 - Math.round(puntaje))}</span>
      </span>
      <span className="text-slate-600">{puntaje.toFixed(1)}</span>
      {cantidad !== undefined && <span className="text-slate-400">({cantidad})</span>}
    </span>
  )
}
