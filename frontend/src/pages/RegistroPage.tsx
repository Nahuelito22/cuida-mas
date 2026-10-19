import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { INICIO_POR_ROL, useAuth } from '../auth/sesion'
import type { DatosRegistro } from '../api/servicios'
import { LayoutAuth } from '../components/layout/LayoutAuth'
import { Boton } from '../components/ui/Boton'
import { CampoTexto } from '../components/ui/Campos'
import { Alerta } from '../components/ui/Tarjeta'
import { validarRegistro, type Errores as ErroresDe } from '../utils/validaciones'

type Errores = ErroresDe<DatosRegistro>

export function RegistroPage() {
  const { usuario, registrar } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [datos, setDatos] = useState<DatosRegistro>({
    rol: params.get('rol') === 'ENFERMERO' ? 'ENFERMERO' : 'PACIENTE',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    password: '',
  })
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  if (usuario) return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />

  const cambiar = (campo: keyof DatosRegistro, valor: string) => setDatos((d) => ({ ...d, [campo]: valor }))

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const nuevos = validarRegistro(datos)
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setCargando(true)
    setError(null)
    try {
      const u = await registrar({ ...datos, telefono: datos.telefono || undefined })
      // El enfermero arranca completando su perfil profesional.
      navigate(u.rol === 'ENFERMERO' ? '/app/perfil' : INICIO_POR_ROL[u.rol], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
    } finally {
      setCargando(false)
    }
  }

  return (
    <LayoutAuth
      titulo="Crear cuenta"
      subtitulo={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Ingresá
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alerta>{error}</Alerta>}

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Me registro como</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['PACIENTE', 'ENFERMERO'] as const).map((rol) => (
              <button
                key={rol}
                type="button"
                aria-pressed={datos.rol === rol}
                onClick={() => setDatos((d) => ({ ...d, rol }))}
                className={`rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset ${
                  datos.rol === rol ? 'bg-brand-50 text-brand-700 ring-brand-400' : 'text-slate-600 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                {rol === 'PACIENTE' ? 'Paciente / familiar' : 'Enfermero/a'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="Nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} error={errores.nombre} />
          <CampoTexto etiqueta="Apellido" value={datos.apellido} onChange={(e) => cambiar('apellido', e.target.value)} error={errores.apellido} />
          <CampoTexto etiqueta="DNI" inputMode="numeric" value={datos.dni} onChange={(e) => cambiar('dni', e.target.value)} error={errores.dni} />
          <CampoTexto etiqueta="Teléfono (opcional)" type="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
        </div>
        <CampoTexto etiqueta="Email" type="email" autoComplete="email" value={datos.email} onChange={(e) => cambiar('email', e.target.value)} error={errores.email} />
        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          value={datos.password}
          onChange={(e) => cambiar('password', e.target.value)}
          error={errores.password}
          ayuda="Mínimo 8 caracteres"
        />

        <Boton type="submit" cargando={cargando} className="w-full">
          Crear cuenta
        </Boton>
      </form>
    </LayoutAuth>
  )
}
