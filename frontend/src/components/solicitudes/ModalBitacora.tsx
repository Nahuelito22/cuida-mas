import { solicitudesApi } from '../../api/servicios'
import { useCarga } from '../../hooks/useCarga'
import type { Solicitud } from '../../types'
import { formatearFechaHora } from '../../utils/formato'
import { Modal } from '../ui/Modal'
import { Cargando } from '../ui/Spinner'
import { Alerta } from '../ui/Tarjeta'

/** Bitácora de visitas: la ven paciente, enfermero asignado y centro de salud. */
export function ModalBitacora({ solicitud, onCerrar }: { solicitud: Solicitud; onCerrar: () => void }) {
  const { datos: visitas, cargando, error } = useCarga(() => solicitudesApi.visitas(solicitud.id), [solicitud.id])

  return (
    <Modal abierto titulo={`Bitácora — ${solicitud.pacienteNombre}`} onCerrar={onCerrar} ancho="lg">
      {cargando && <Cargando />}
      {error && <Alerta>{error}</Alerta>}
      {visitas && visitas.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">Todavía no hay visitas registradas.</p>
      )}
      {visitas && visitas.length > 0 && (
        <ol className="relative space-y-6 border-l-2 border-brand-100 pl-6">
          {visitas.map((v) => (
            <li key={v.id} className="relative">
              <span className="absolute -left-[31px] top-1 size-3 rounded-full bg-brand-500 ring-4 ring-white" aria-hidden="true" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {formatearFechaHora(v.fecha)} · {v.enfermero.nombre} {v.enfermero.apellido}
              </p>
              {v.practicasRealizadas.length > 0 && (
                <p className="mt-1 text-sm font-medium text-slate-800">{v.practicasRealizadas.map((p) => p.nombre).join(', ')}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">{v.observaciones}</p>
              {(v.presionArterial || v.temperatura) && (
                <p className="mt-1 text-xs text-slate-500">
                  {v.presionArterial && <>PA {v.presionArterial} mmHg</>}
                  {v.presionArterial && v.temperatura && ' · '}
                  {v.temperatura && <>T° {v.temperatura} °C</>}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
