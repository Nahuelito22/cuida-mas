import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type Tamanio = 'sm' | 'md'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secundario:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  peligro: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  fantasma: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

const TAMANIOS: Record<Tamanio, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanio?: Tamanio
  cargando?: boolean
  icono?: ReactNode
}

export function Boton({
  variante = 'primario',
  tamanio = 'md',
  cargando = false,
  icono,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${TAMANIOS[tamanio]} ${className}`}
      {...props}
    >
      {cargando ? <Spinner className="size-4" /> : icono}
      {children}
    </button>
  )
}
