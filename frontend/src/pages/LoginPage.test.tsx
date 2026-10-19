import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { mockFetch } from '../test/utilidades'
import { LoginPage } from './LoginPage'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/panel" element={<p>Panel del centro de salud</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/** JWT falso con vencimiento en una hora (el front solo lee `exp`). */
const tokenValido = `x.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.y`

describe('LoginPage', () => {
  it('valida que se completen los campos sin llamar a la API', async () => {
    const fetchMock = mockFetch()
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Completá email y contraseña')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('muestra el mensaje del servidor si las credenciales son incorrectas', async () => {
    mockFetch({ status: 401, body: { statusCode: 401, message: 'Email o contraseña incorrectos' } })
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'admin@cuidamas.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos')
  })

  it('con credenciales válidas guarda la sesión y redirige al panel según el rol', async () => {
    const fetchMock = mockFetch({
      body: {
        accessToken: tokenValido,
        usuario: { id: '1', email: 'admin@cuidamas.com', nombre: 'Centro', apellido: 'Salud', dni: '1', rol: 'ADMIN', activo: true },
      },
    })
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'admin@cuidamas.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Admin1234')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Panel del centro de salud')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
    expect(localStorage.getItem('cuidamas.sesion')).toContain(tokenValido)
  })
})
