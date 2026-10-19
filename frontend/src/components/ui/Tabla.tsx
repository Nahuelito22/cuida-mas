import type { ReactNode } from 'react'

export interface Columna<T> {
  titulo: string
  celda: (fila: T) => ReactNode
  className?: string
}

interface Props<T> {
  columnas: Columna<T>[]
  filas: T[]
  clave: (fila: T) => string
  vacio?: ReactNode
}

/**
 * Tabla genérica y reutilizable. En pantallas chicas cada fila se muestra como
 * una tarjeta con "etiqueta: valor" para no obligar a hacer scroll horizontal.
 */
export function Tabla<T>({ columnas, filas, clave, vacio }: Props<T>) {
  if (!filas.length) {
    return <>{vacio ?? <p className="py-8 text-center text-sm text-slate-500">No hay datos para mostrar.</p>}</>
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columnas.map((col) => (
                <th key={col.titulo} scope="col" className={`px-4 py-3 text-left font-semibold text-slate-600 ${col.className ?? ''}`}>
                  {col.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila) => (
              <tr key={clave(fila)} className="hover:bg-slate-50/60">
                {columnas.map((col) => (
                  <td key={col.titulo} className={`px-4 py-3 align-top text-slate-700 ${col.className ?? ''}`}>
                    {col.celda(fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {filas.map((fila) => (
          <li key={clave(fila)} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <dl className="space-y-2 text-sm">
              {columnas.map((col) => (
                <div key={col.titulo} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-slate-500">{col.titulo}</dt>
                  <dd className="text-right text-slate-800">{col.celda(fila)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
