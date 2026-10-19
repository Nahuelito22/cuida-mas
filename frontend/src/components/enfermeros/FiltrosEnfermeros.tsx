import { practicasApi, zonasApi } from '../../api/servicios'
import { useCarga } from '../../hooks/useCarga'
import { CampoSelect, CampoTexto } from '../ui/Campos'

export interface Filtro {
  zonaId: string
  practicaId: string
  q: string
}

/** Búsqueda de enfermeros por zona, práctica y nombre/matrícula. */
export function FiltrosEnfermeros({ filtro, onChange }: { filtro: Filtro; onChange: (f: Filtro) => void }) {
  const { datos } = useCarga(() => Promise.all([zonasApi.listar(), practicasApi.listar(true)]))
  const [zonas, practicas] = datos ?? [[], []]

  return (
    <div className="mb-5 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3">
      <CampoSelect etiqueta="Zona" value={filtro.zonaId} onChange={(e) => onChange({ ...filtro, zonaId: e.target.value })}>
        <option value="">Todas</option>
        {zonas.map((z) => (
          <option key={z.id} value={z.id}>
            {z.nombre} ({z.departamento})
          </option>
        ))}
      </CampoSelect>
      <CampoSelect etiqueta="Práctica" value={filtro.practicaId} onChange={(e) => onChange({ ...filtro, practicaId: e.target.value })}>
        <option value="">Todas</option>
        {practicas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </CampoSelect>
      <CampoTexto etiqueta="Buscar" placeholder="Nombre o matrícula" value={filtro.q} onChange={(e) => onChange({ ...filtro, q: e.target.value })} />
    </div>
  )
}
