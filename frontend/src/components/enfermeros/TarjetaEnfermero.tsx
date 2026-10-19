import type { ReactNode } from 'react'
import { BadgeCheck, Phone } from 'lucide-react'
import type { Enfermero } from '../../types'
import { Estrellas, Insignia } from '../ui/Insignias'

/** Perfil resumido de un enfermero (directorio y panel de verificación). */
export function TarjetaEnfermero({ enfermero: e, acciones }: { enfermero: Enfermero; acciones?: ReactNode }) {
  const iniciales = `${e.nombre[0] ?? ''}${e.apellido[0] ?? ''}`
  return (
    <article className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{iniciales}</span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-semibold text-slate-900">
            {e.nombre} {e.apellido}
            {e.verificado && <BadgeCheck className="size-4 text-brand-600" aria-label="Matrícula verificada" />}
          </h3>
          <p className="text-sm text-slate-500">Matrícula {e.matricula}</p>
          <div className="mt-1">
            <Estrellas puntaje={e.puntajePromedio} cantidad={e.cantidadResenas} />
          </div>
        </div>
        {!e.verificado && <Insignia color="ambar">Sin verificar</Insignia>}
      </div>

      {e.bio && <p className="mt-3 text-sm text-slate-600">{e.bio}</p>}

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {e.practicas.map((p) => (
            <Insignia key={p.id} color="verde">
              {p.nombre}
            </Insignia>
          ))}
        </div>
        <p className="text-slate-500">
          <span className="font-medium text-slate-600">Zonas:</span> {e.zonas.map((z) => z.nombre).join(', ')}
        </p>
        {e.telefono && (
          <p className="flex items-center gap-1.5 text-slate-500">
            <Phone className="size-3.5" /> {e.telefono}
          </p>
        )}
      </div>

      {acciones && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{acciones}</div>}
    </article>
  )
}
