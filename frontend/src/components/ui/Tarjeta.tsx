import type { ReactNode } from 'react'

export function Tarjeta({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      {children}
    </div>
  )
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  )
}

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <p className="font-medium text-slate-700">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}

export function Alerta({
  tipo = 'error',
  children,
}: {
  tipo?: 'error' | 'exito' | 'info'
  children: ReactNode
}) {
  const estilos = {
    error: 'bg-red-50 text-red-800 ring-red-200',
    exito: 'bg-brand-50 text-brand-800 ring-brand-200',
    info: 'bg-sky-50 text-sky-800 ring-sky-200',
  }
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${estilos[tipo]}`}>
      {children}
    </div>
  )
}
