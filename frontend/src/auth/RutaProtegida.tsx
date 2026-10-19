import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Rol } from '../types'
import { INICIO_POR_ROL, useAuth } from './sesion'

interface Props {
  children: ReactNode
  /** Si se indica, solo esos roles pueden entrar. */
  roles?: Rol[]
}

/**
 * Sección protegida: sin sesión redirige al login (recordando a dónde quería ir);
 * con un rol no permitido, lo manda a su propia página de inicio.
 */
export function RutaProtegida({ children, roles }: Props) {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />
  }
  return children
}
