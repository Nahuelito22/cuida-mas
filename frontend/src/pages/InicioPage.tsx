import { Link } from 'react-router'
import { BarChart3, ClipboardCheck, Hospital, NotebookPen, ShieldCheck, type LucideIcon } from 'lucide-react'
import { INICIO_POR_ROL, useAuth } from '../auth/sesion'
import { Logo } from '../components/layout/Logo'

const PASOS: { icono: LucideIcon; titulo: string; texto: string }[] = [
  {
    icono: Hospital,
    titulo: 'El centro deriva',
    texto: 'Al dar el alta, el centro de salud carga un plan de cuidados: prácticas, frecuencia y fechas.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Enfermería verificada',
    texto: 'Solo enfermeros con matrícula verificada que atienden la zona y hacen esas prácticas pueden tomarlo.',
  },
  {
    icono: NotebookPen,
    titulo: 'Bitácora compartida',
    texto: 'Cada visita queda registrada. Paciente, familia y centro siguen la evolución en el mismo lugar.',
  },
  {
    icono: BarChart3,
    titulo: 'Cobertura por zona',
    texto: 'El centro ve qué zonas tienen demanda sin enfermeros suficientes para actuar a tiempo.',
  },
]

export function InicioPage() {
  const { usuario } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {usuario ? (
            <Link to={INICIO_POR_ROL[usuario.rol]} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Ingresar
              </Link>
              <Link to="/registro" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pt-20">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            <ClipboardCheck className="size-4" /> Continuidad del cuidado después del alta
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Enfermería a domicilio, <span className="text-brand-600">sin perder el hilo</span> del tratamiento.
          </h1>
          <p className="mt-5 text-lg text-slate-600">
            Cuidá+ conecta a pacientes que reciben el alta con enfermeros matriculados de su zona, y le devuelve al
            centro de salud la información de cada visita.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/registro" className="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-brand-700">
              Soy paciente o familiar
            </Link>
            <Link
              to="/registro?rol=ENFERMERO"
              className="rounded-lg px-5 py-3 font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              Soy enfermero/a
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {PASOS.map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <Icono className="size-5" />
              </span>
              <h2 className="mt-4 font-semibold text-slate-900">{titulo}</h2>
              <p className="mt-2 text-sm text-slate-600">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        Cuidá+ · Trabajo Práctico Integrador — Programación III, IES 9-023 · 2026
      </footer>
    </div>
  )
}
