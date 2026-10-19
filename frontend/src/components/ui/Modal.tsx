import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  pie?: ReactNode
  ancho?: 'md' | 'lg'
}

/** Diálogo accesible: se cierra con Escape o haciendo clic fuera. */
export function Modal({ abierto, titulo, onCerrar, children, pie, ancho = 'md' }: Props) {
  const idTitulo = useId()

  useEffect(() => {
    if (!abierto) return
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alPresionar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${ancho === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={idTitulo} className="text-lg font-semibold text-slate-900">
            {titulo}
          </h2>
          <button onClick={onCerrar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{pie}</div>}
      </div>
    </div>
  )
}
