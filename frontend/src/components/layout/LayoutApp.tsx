import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  BarChart3,
  ClipboardList,
  HeartPulse,
  Inbox,
  LogOut,
  MapPin,
  Menu,
  Send,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../auth/sesion'
import type { Rol } from '../../types'
import { Logo } from './Logo'

interface Enlace {
  a: string
  texto: string
  icono: LucideIcon
}

const MENU: Record<Rol, Enlace[]> = {
  PACIENTE: [
    { a: '/app/solicitudes', texto: 'Mis cuidados', icono: ClipboardList },
    { a: '/app/enfermeros', texto: 'Enfermeros', icono: Users },
  ],
  ENFERMERO: [
    { a: '/app/disponibles', texto: 'Disponibles', icono: Inbox },
    { a: '/app/asignadas', texto: 'Mis pacientes', icono: HeartPulse },
    { a: '/app/perfil', texto: 'Mi perfil', icono: UserRound },
  ],
  ADMIN: [
    { a: '/app/panel', texto: 'Cobertura', icono: BarChart3 },
    { a: '/app/derivar', texto: 'Derivar paciente', icono: Send },
    { a: '/app/gestion', texto: 'Solicitudes', icono: ClipboardList },
    { a: '/app/verificaciones', texto: 'Enfermeros', icono: ShieldCheck },
    { a: '/app/practicas', texto: 'Prácticas', icono: Stethoscope },
    { a: '/app/zonas', texto: 'Zonas', icono: MapPin },
  ],
}

const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN: 'Centro de salud',
  ENFERMERO: 'Enfermería',
  PACIENTE: 'Paciente',
}

export function LayoutApp() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  if (!usuario) return null

  const cerrarSesion = () => {
    logout()
    navigate('/login')
  }

  const navegacion = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Menú principal">
      {MENU[usuario.rol].map(({ a, texto, icono: Icono }) => (
        <NavLink
          key={a}
          to={a}
          onClick={() => setMenuAbierto(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icono className="size-5 shrink-0" />
          {texto}
        </NavLink>
      ))}
    </nav>
  )

  const pieUsuario = (
    <div className="border-t border-slate-200 pt-4">
      <p className="truncate text-sm font-medium text-slate-900">
        {usuario.nombre} {usuario.apellido}
      </p>
      <p className="text-xs text-slate-500">{NOMBRE_ROL[usuario.rol]}</p>
      <button
        onClick={cerrarSesion}
        className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
      >
        <LogOut className="size-4" /> Cerrar sesión
      </button>
    </div>
  )

  return (
    <div className="min-h-screen md:flex">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-slate-200 bg-white p-5 md:sticky md:top-0 md:flex md:h-screen">
        <Logo />
        {navegacion}
        {pieUsuario}
      </aside>

      {/* Barra superior + menú desplegable (celular) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Logo />
        <button onClick={() => setMenuAbierto(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Abrir menú">
          <Menu className="size-6" />
        </button>
      </header>
      {menuAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 md:hidden" onClick={() => setMenuAbierto(false)}>
          <aside className="flex h-full w-72 flex-col gap-6 bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setMenuAbierto(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar menú">
                <X className="size-5" />
              </button>
            </div>
            {navegacion}
            {pieUsuario}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
