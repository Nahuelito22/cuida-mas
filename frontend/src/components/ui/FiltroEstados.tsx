import type { EstadoSolicitud } from '../../types'

const OPCIONES: { valor: EstadoSolicitud | ''; texto: string }[] = [
  { valor: '', texto: 'Todas' },
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'ACEPTADA', texto: 'Aceptadas' },
  { valor: 'EN_CURSO', texto: 'En curso' },
  { valor: 'FINALIZADA', texto: 'Finalizadas' },
  { valor: 'CANCELADA', texto: 'Canceladas' },
]

/** Pestañas para filtrar solicitudes por estado. */
export function FiltroEstados({ valor, onChange }: { valor: EstadoSolicitud | ''; onChange: (v: EstadoSolicitud | '') => void }) {
  return (
    <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Filtrar por estado">
        {OPCIONES.map((op) => (
          <button
            key={op.texto}
            role="tab"
            aria-selected={valor === op.valor}
            onClick={() => onChange(op.valor)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              valor === op.valor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  )
}
