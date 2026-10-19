import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/sesion'
import type { Rol, Usuario } from '../types'

export function usuarioDePrueba(rol: Rol): Usuario {
  return {
    id: 'u1',
    email: 'test@mail.com',
    nombre: 'Ana',
    apellido: 'Pérez',
    dni: '30111222',
    rol,
    activo: true,
  }
}

/** Renderiza dentro de un router en memoria y con una sesión simulada. */
export function renderConSesion(
  ui: ReactNode,
  { rol, ruta = '/', rutas = [] }: { rol?: Rol; ruta?: string; rutas?: { path: string; element: ReactNode }[] } = {},
) {
  const auth: AuthContextValue = {
    usuario: rol ? usuarioDePrueba(rol) : null,
    token: rol ? 'token' : null,
    login: vi.fn(),
    registrar: vi.fn(),
    logout: vi.fn(),
  }
  return {
    auth,
    ...render(
      <AuthContext value={auth}>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route path={ruta} element={ui} />
            {rutas.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Routes>
        </MemoryRouter>
      </AuthContext>,
    ),
  }
}

/** Simula respuestas de fetch en orden de llamada. */
export function mockFetch(...respuestas: { status?: number; body: unknown }[]) {
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  respuestas.forEach(({ status = 200, body }) =>
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    ),
  )
  return fetchMock
}
