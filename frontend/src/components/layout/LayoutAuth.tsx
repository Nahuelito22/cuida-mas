import type { ReactNode } from 'react'
import { Logo } from './Logo'

/** Marco centrado para las pantallas de login y registro. */
export function LayoutAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">{titulo}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
