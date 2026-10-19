import { AlertTriangle, ClipboardList, HeartPulse, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { estadisticasApi } from '../../api/servicios'
import { InsigniaCobertura } from '../../components/ui/Insignias'
import { Cargando } from '../../components/ui/Spinner'
import { Tabla } from '../../components/ui/Tabla'
import { Alerta, EncabezadoPagina } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import type { CoberturaZona } from '../../types'

/** Tablero del centro de salud: demanda de cuidados vs. enfermeros verificados por zona. */
export function PanelPage() {
  const { datos, cargando, error } = useCarga(estadisticasApi.cobertura)

  if (cargando) return <Cargando />
  if (error || !datos) return <Alerta>{error}</Alerta>

  const total = (campo: keyof Pick<CoberturaZona, 'pendientes' | 'activas'>) => datos.reduce((s, z) => s + z[campo], 0)
  const criticas = datos.filter((z) => z.nivel === 'CRITICA' || z.nivel === 'BAJA')
  const maxCarga = Math.max(1, ...datos.map((z) => z.pendientes + z.activas))

  return (
    <>
      <EncabezadoPagina titulo="Cobertura por zona" descripcion="Dónde hay pacientes esperando cuidados y cuántos enfermeros verificados los pueden atender." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador icono={<ClipboardList />} titulo="Pendientes" valor={total('pendientes')} detalle="sin enfermero asignado" />
        <Indicador icono={<HeartPulse />} titulo="En atención" valor={total('activas')} detalle="aceptadas o en curso" />
        <Indicador icono={<Users />} titulo="Zonas cubiertas" valor={datos.filter((z) => z.enfermerosVerificados > 0).length} detalle={`de ${datos.length} zonas`} />
        <Indicador
          icono={<AlertTriangle />}
          titulo="Zonas en alerta"
          valor={criticas.length}
          detalle="cobertura crítica o baja"
          alerta={criticas.length > 0}
        />
      </div>

      <Tabla
        filas={datos}
        clave={(z) => z.zonaId}
        columnas={[
          {
            titulo: 'Zona',
            celda: (z) => (
              <>
                <span className="font-medium text-slate-900">{z.zona}</span>
                <span className="block text-xs text-slate-500">{z.departamento}</span>
              </>
            ),
          },
          {
            titulo: 'Demanda abierta',
            celda: (z) => {
              const abiertas = z.pendientes + z.activas
              return (
                <div className="flex items-center justify-end gap-2 md:justify-start">
                  <div className="hidden h-2 w-28 overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden="true">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(abiertas / maxCarga) * 100}%` }} />
                  </div>
                  <span>
                    {abiertas} <span className="text-xs text-slate-400">({z.pendientes} pend.)</span>
                  </span>
                </div>
              )
            },
          },
          { titulo: 'Enfermeros verificados', celda: (z) => z.enfermerosVerificados },
          { titulo: 'Carga por enfermero', celda: (z) => (z.cargaPorEnfermero === null ? '—' : z.cargaPorEnfermero) },
          { titulo: 'Finalizadas', celda: (z) => z.finalizadas },
          { titulo: 'Cobertura', celda: (z) => <InsigniaCobertura nivel={z.nivel} /> },
        ]}
      />
      <p className="mt-3 text-xs text-slate-500">
        Crítica: hay demanda y ningún enfermero verificado. Baja: más de 3 solicitudes abiertas por enfermero.
      </p>
    </>
  )
}

function Indicador({ icono, titulo, valor, detalle, alerta }: { icono: ReactNode; titulo: string; valor: number; detalle: string; alerta?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-lg [&>svg]:size-5 ${alerta ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>{icono}</span>
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{valor}</p>
      <p className="text-xs text-slate-500">{detalle}</p>
    </div>
  )
}
