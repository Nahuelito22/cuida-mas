import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InsigniaEstado } from './Insignias'
import { SelectorMultiple } from './Campos'
import { Tabla } from './Tabla'

interface Fila {
  id: string
  nombre: string
}

describe('Tabla (componente reutilizable)', () => {
  const columnas = [{ titulo: 'Nombre', celda: (f: Fila) => f.nombre }]

  it('muestra una fila por elemento', () => {
    render(
      <Tabla
        columnas={columnas}
        filas={[
          { id: '1', nombre: 'Curación' },
          { id: '2', nombre: 'Inyectable' },
        ]}
        clave={(f) => f.id}
      />,
    )
    const tabla = screen.getByRole('table')
    expect(within(tabla).getAllByRole('row')).toHaveLength(3) // encabezado + 2 filas
    expect(within(tabla).getByText('Inyectable')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay filas', () => {
    render(<Tabla columnas={columnas} filas={[]} clave={(f) => f.id} vacio={<p>Sin prácticas</p>} />)
    expect(screen.getByText('Sin prácticas')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('SelectorMultiple (relaciones muchos-a-muchos)', () => {
  it('agrega y quita opciones al hacer clic', async () => {
    const onChange = vi.fn()
    const opciones = [
      { id: 'a', etiqueta: 'Capital' },
      { id: 'b', etiqueta: 'Lavalle' },
    ]
    const { rerender } = render(<SelectorMultiple etiqueta="Zonas" opciones={opciones} seleccionados={['a']} onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Capital' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Lavalle' }))
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])

    rerender(<SelectorMultiple etiqueta="Zonas" opciones={opciones} seleccionados={['a', 'b']} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Capital' }))
    expect(onChange).toHaveBeenLastCalledWith(['b'])
  })
})

describe('InsigniaEstado', () => {
  it('traduce el estado de la solicitud a un texto legible', () => {
    render(<InsigniaEstado estado="EN_CURSO" />)
    expect(screen.getByText('En curso')).toBeInTheDocument()
  })
})
