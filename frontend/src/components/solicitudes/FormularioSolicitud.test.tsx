import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockFetch } from '../../test/utilidades'
import { FormularioSolicitud } from './FormularioSolicitud'

const zonas = [{ id: 'z1', nombre: 'Villa Nueva', departamento: 'Guaymallén' }]
const practicas = { data: { practicas: [{ id: 'p1', nombre: 'Curación', duracionEstimadaMin: 30, activa: true }] } }

describe('FormularioSolicitud', () => {
  it('no envía la solicitud y muestra los errores si faltan datos', async () => {
    const fetchMock = mockFetch({ body: zonas }, { body: practicas })
    const onGuardado = vi.fn()
    render(<FormularioSolicitud onGuardado={onGuardado} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Pedir cuidados' }))

    expect(screen.getByText('Elegí al menos una práctica')).toBeInTheDocument()
    expect(screen.getByText('Elegí la zona del domicilio')).toBeInTheDocument()
    expect(screen.getByText('La dirección es obligatoria')).toBeInTheDocument()
    // Solo se pidieron los catálogos; la mutación nunca se envió.
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onGuardado).not.toHaveBeenCalled()
  })

  it('envía la mutación GraphQL crearSolicitud con los datos cargados', async () => {
    const solicitudCreada = { id: 's1', estado: 'PENDIENTE' }
    const fetchMock = mockFetch({ body: zonas }, { body: practicas }, { body: { data: { crearSolicitud: solicitudCreada } } })
    const onGuardado = vi.fn()
    render(<FormularioSolicitud onGuardado={onGuardado} />)

    await userEvent.click(await screen.findByRole('button', { name: /Curación/ }))
    await userEvent.selectOptions(screen.getByLabelText('Zona'), 'z1')
    await userEvent.type(screen.getByLabelText('Dirección'), 'San Martín 500')
    await userEvent.type(screen.getByLabelText('Hasta'), '2099-12-31')
    await userEvent.click(screen.getByRole('button', { name: 'Pedir cuidados' }))

    await vi.waitFor(() => expect(onGuardado).toHaveBeenCalledWith(solicitudCreada))
    const [url, init] = fetchMock.mock.calls[2]
    expect(url).toBe('/graphql')
    const body = JSON.parse(String((init as RequestInit).body)) as { query: string; variables: { input: Record<string, unknown> } }
    expect(body.query).toContain('crearSolicitud')
    expect(body.variables.input).toMatchObject({ zonaId: 'z1', practicaIds: ['p1'], direccion: 'San Martín 500' })
  })
})
