import { createContext, useContext } from 'react'
import type { DatosRegistro } from '../api/servicios'
import type { Rol, Usuario } from '../types'

export interface AuthContextValue {
  usuario: Usuario | null
  token: string | null
  login: (email: string, password: string) => Promise<Usuario>
  registrar: (datos: DatosRegistro) => Promise<Usuario>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

/** Página de inicio de cada rol dentro de la sección privada. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  ADMIN: '/app/panel',
  ENFERMERO: '/app/disponibles',
  PACIENTE: '/app/solicitudes',
}
