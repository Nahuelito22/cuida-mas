import type { ReactNode } from 'react'
import { CalendarDays, Hospital, MapPin, Repeat, UserRound } from 'lucide-react'
import type { Solicitud } from '../../types'
import { formatearFecha, nombreCompleto } from '../../utils/formato'
import { Insignia, InsigniaEstado } from '../ui/Insignias'

interface Props {
  solicitud: Solicitud
  /** Muestra el nombre del paciente (vista de enfermero y de centro de salud). */
  mostrarPaciente?: boolean
  acciones?: ReactNode
}

/** Resumen de un plan de cuidados. Lo usan las vistas de los tres roles. */
export function TarjetaSolicitud({ solicitud: s, mostrarPaciente = false, acciones }: Props) {
  return (
    <article className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <InsigniaEstado estado={s.estado} />
        {s.origen === 'DERIVACION' && <Insignia color="azul">Derivación</Insignia>}
      </div>

      <h3 className="mt-3 font-semibold text-slate-900">{s.practicas.map((p) => p.nombre).join(' · ')}</h3>

      <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
        {mostrarPaciente && (
          <Dato icono={<UserRound className="size-4" />} etiqueta="Paciente">
            {s.pacienteNombre}
          </Dato>
        )}
        <Dato icono={<MapPin className="size-4" />} etiqueta="Domicilio">
          {s.direccion} — {s.zona.nombre} ({s.zona.departamento})
        </Dato>
        <Dato icono={<CalendarDays className="size-4" />} etiqueta="Período">
          {formatearFecha(s.fechaInicio)} al {formatearFecha(s.fechaFin)}
        </Dato>
        <Dato icono={<Repeat className="size-4" />} etiqueta="Frecuencia">
          {s.frecuencia}
        </Dato>
        {s.centroOrigen && (
          <Dato icono={<Hospital className="size-4" />} etiqueta="Derivado por">
            {s.centroOrigen}
          </Dato>
        )}
      </dl>

      {s.observaciones && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{s.observaciones}</p>}

      {s.enfermero && (
        <p className="mt-3 text-sm text-slate-600">
          <span className="text-slate-400">Enfermero/a:</span>{' '}
          <span className="font-medium text-slate-800">{nombreCompleto(s.enfermero)}</span> · Mat. {s.enfermero.matricula}
          {s.enfermero.telefono && <> · {s.enfermero.telefono}</>}
        </p>
      )}
      {s.estado === 'CANCELADA' && s.motivoCancelacion && (
        <p className="mt-3 text-sm text-slate-500">Motivo de cancelación: {s.motivoCancelacion}</p>
      )}

      {acciones && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{acciones}</div>}
    </article>
  )
}

function Dato({ icono, etiqueta, children }: { icono: ReactNode; etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="mt-0.5 shrink-0 text-slate-400" title={etiqueta}>
        {icono}
        <span className="sr-only">{etiqueta}</span>
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Grilla responsive de tarjetas. */
export function GrillaSolicitudes({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>
}
