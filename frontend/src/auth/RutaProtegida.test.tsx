import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderConSesion } from '../test/utilidades'
import { RutaProtegida } from './RutaProtegida'

const rutasDestino = [
  { path: '/login', element: <p>Pantalla de login</p> },
  { path: '/app/solicitudes', element: <p>Inicio del paciente</p> },
]

describe('RutaProtegida (sección con autenticación)', () => {
  it('sin sesión redirige al login', () => {
    renderConSesion(<RutaProtegida><p>Contenido privado</p></RutaProtegida>, {
      ruta: '/app/panel',
      rutas: rutasDestino,
    })
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('con el rol permitido muestra el contenido', () => {
    renderConSesion(<RutaProtegida roles={['ADMIN']}><p>Contenido privado</p></RutaProtegida>, {
      rol: 'ADMIN',
      ruta: '/app/panel',
      rutas: rutasDestino,
    })
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })

  it('con otro rol lo manda a su propia página de inicio', () => {
    renderConSesion(<RutaProtegida roles={['ADMIN']}><p>Contenido privado</p></RutaProtegida>, {
      rol: 'PACIENTE',
      ruta: '/app/panel',
      rutas: rutasDestino,
    })
    expect(screen.getByText('Inicio del paciente')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })
})
