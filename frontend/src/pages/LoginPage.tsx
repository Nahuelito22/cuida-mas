import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { INICIO_POR_ROL, useAuth } from '../auth/sesion'
import { LayoutAuth } from '../components/layout/LayoutAuth'
import { Boton } from '../components/ui/Boton'
import { CampoTexto } from '../components/ui/Campos'
import { Alerta } from '../components/ui/Tarjeta'

export function LoginPage() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const desde = (location.state as { desde?: string } | null)?.desde

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  if (usuario) return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Completá email y contraseña')
      return
    }
    setCargando(true)
    setError(null)
    try {
      const u = await login(email, password)
      navigate(desde ?? INICIO_POR_ROL[u.rol], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <LayoutAuth
      titulo="Ingresar"
      subtitulo={
        <>
          ¿No tenés cuenta?{' '}
          <Link to="/registro" className="font-medium text-brand-600 hover:underline">
            Registrate
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alerta>{error}</Alerta>}
        <CampoTexto etiqueta="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Boton type="submit" cargando={cargando} className="w-full">
          Ingresar
        </Boton>
      </form>
    </LayoutAuth>
  )
}
