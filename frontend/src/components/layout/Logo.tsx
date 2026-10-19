import { Link } from 'react-router'

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Cuidá+ inicio">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-lg font-bold text-white">+</span>
      <span className={`text-lg font-bold tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>
        Cuidá<span className="text-brand-500">+</span>
      </span>
    </Link>
  )
}
