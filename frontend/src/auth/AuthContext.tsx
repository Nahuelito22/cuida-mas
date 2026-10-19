import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { configurarCliente } from '../api/cliente'
import { authApi, type DatosRegistro } from '../api/servicios'
import type { Usuario } from '../types'
import { tokenVencido } from '../utils/validaciones'
import { AuthContext } from './sesion'

const CLAVE_STORAGE = 'cuidamas.sesion'

interface Sesion {
  token: string
  usuario: Usuario
}

function leerSesion(): Sesion | null {
  try {
    const guardada = localStorage.getItem(CLAVE_STORAGE)
    if (!guardada) return null
    const sesion = JSON.parse(guardada) as Sesion
    return tokenVencido(sesion.token) ? null : sesion
  } catch {
    return null
  }
}

function guardarSesion(sesion: Sesion | null) {
  try {
    if (sesion) localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion))
    else localStorage.removeItem(CLAVE_STORAGE)
  } catch {
    // Sin acceso a localStorage (modo privado): la sesión dura lo que la pestaña.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion)

  const actualizar = useCallback((nueva: Sesion | null) => {
    guardarSesion(nueva)
    setSesion(nueva)
  }, [])

  const logout = useCallback(() => actualizar(null), [actualizar])

  // Se configura durante el render para que las páginas hijas ya tengan el token
  // en su primera petición (sus efectos corren antes que los del provider).
  configurarCliente({
    obtenerToken: () => sesion?.token ?? null,
    alExpirarSesion: logout,
  })

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken, usuario } = await authApi.login(email, password)
      actualizar({ token: accessToken, usuario })
      return usuario
    },
    [actualizar],
  )

  const registrar = useCallback(
    async (datos: DatosRegistro) => {
      await authApi.registro(datos)
      return login(datos.email, datos.password)
    },
    [login],
  )

  const value = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      token: sesion?.token ?? null,
      login,
      registrar,
      logout,
    }),
    [sesion, login, registrar, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
