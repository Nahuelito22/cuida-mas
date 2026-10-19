import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const CONTROL =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100'

interface CampoProps {
  etiqueta: string
  error?: string
  ayuda?: string
  children: (id: string, describedBy?: string) => ReactNode
}

/** Envoltorio común: etiqueta asociada, texto de ayuda y mensaje de error accesible. */
function Campo({ etiqueta, error, ayuda, children }: CampoProps) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      {children(id, error || ayuda ? idAyuda : undefined)}
      {error ? (
        <p id={idAyuda} className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={idAyuda} className="text-xs text-slate-500">
            {ayuda}
          </p>
        )
      )}
    </div>
  )
}

type Base = { etiqueta: string; error?: string; ayuda?: string }

export function CampoTexto({ etiqueta, error, ayuda, className = '', ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda}>
      {(id, describedBy) => (
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${CONTROL} ${error ? 'ring-red-400' : ''} ${className}`}
          {...props}
        />
      )}
    </Campo>
  )
}

export function CampoSelect({ etiqueta, error, ayuda, className = '', children, ...props }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${CONTROL} ${className}`}
          {...props}
        >
          {children}
        </select>
      )}
    </Campo>
  )
}

export function CampoArea({ etiqueta, error, ayuda, className = '', ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda}>
      {(id, describedBy) => (
        <textarea
          id={id}
          rows={3}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${CONTROL} ${className}`}
          {...props}
        />
      )}
    </Campo>
  )
}

interface Opcion {
  id: string
  etiqueta: string
  detalle?: string
}

/** Selección múltiple con chips: se usa para zonas y prácticas (relaciones muchos-a-muchos). */
export function SelectorMultiple({
  etiqueta,
  opciones,
  seleccionados,
  onChange,
  error,
}: {
  etiqueta: string
  opciones: Opcion[]
  seleccionados: string[]
  onChange: (ids: string[]) => void
  error?: string
}) {
  const alternar = (id: string) =>
    onChange(
      seleccionados.includes(id)
        ? seleccionados.filter((s) => s !== id)
        : [...seleccionados, id],
    )

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((op) => {
          const activo = seleccionados.includes(op.id)
          return (
            <button
              key={op.id}
              type="button"
              aria-pressed={activo}
              onClick={() => alternar(op.id)}
              className={`rounded-full px-3 py-1.5 text-sm ring-1 ring-inset transition-colors ${
                activo
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {op.etiqueta}
              {op.detalle && (
                <span className={activo ? 'text-brand-100' : 'text-slate-400'}> · {op.detalle}</span>
              )}
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </fieldset>
  )
}
