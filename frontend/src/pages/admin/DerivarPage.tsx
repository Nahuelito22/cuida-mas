import { useState } from 'react'
import { Link } from 'react-router'
import { Search, UserRound } from 'lucide-react'
import { usuariosApi } from '../../api/servicios'
import { FormularioSolicitud } from '../../components/solicitudes/FormularioSolicitud'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Alerta, EncabezadoPagina, Tarjeta } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import { useDebounce } from '../../hooks/useDebounce'
import type { Usuario } from '../../types'

/** El centro de salud busca al paciente que da de alta y le arma el plan de cuidados. */
export function DerivarPage() {
  const [busqueda, setBusqueda] = useState('')
  const q = useDebounce(busqueda.trim())
  const [paciente, setPaciente] = useState<Usuario | null>(null)
  const [derivada, setDerivada] = useState<string | null>(null)
  const resultados = useCarga(() => (q.length >= 2 ? usuariosApi.buscarPacientes(q) : Promise.resolve([])), [q])

  return (
    <>
      <EncabezadoPagina titulo="Derivar paciente" descripcion="Al dar el alta, cargá el plan de cuidados domiciliarios del paciente." />

      {derivada && (
        <div className="mb-5">
          <Alerta tipo="exito">
            Derivación creada para {derivada}. Los enfermeros de la zona ya la pueden ver.{' '}
            <Link to="/app/gestion" className="font-medium underline">
              Ver solicitudes
            </Link>
          </Alerta>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta>
          <h2 className="font-semibold text-slate-900">1. Paciente</h2>
          {paciente ? (
            <div className="mt-4 rounded-lg bg-brand-50 p-4">
              <p className="font-medium text-slate-900">
                {paciente.nombre} {paciente.apellido}
              </p>
              <p className="text-sm text-slate-600">DNI {paciente.dni}</p>
              <p className="text-sm text-slate-600">{paciente.email}</p>
              <Boton tamanio="sm" variante="secundario" className="mt-3" onClick={() => setPaciente(null)}>
                Cambiar paciente
              </Boton>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <CampoTexto etiqueta="Buscar por nombre, apellido o DNI" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: López o 20111222" />
              {q.length < 2 && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Search className="size-4" /> Escribí al menos 2 caracteres.
                </p>
              )}
              {resultados.error && <Alerta>{resultados.error}</Alerta>}
              <ul className="divide-y divide-slate-100">
                {resultados.datos?.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => {
                        setPaciente(u)
                        setDerivada(null)
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                    >
                      <UserRound className="size-5 text-slate-400" />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">
                          {u.apellido}, {u.nombre}
                        </span>
                        <span className="text-xs text-slate-500">DNI {u.dni}</span>
                      </span>
                    </button>
                  </li>
                ))}
                {q.length >= 2 && resultados.datos?.length === 0 && <li className="py-2 text-sm text-slate-500">Sin resultados.</li>}
              </ul>
            </div>
          )}
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">2. Plan de cuidados</h2>
          {paciente ? (
            <FormularioSolicitud
              key={paciente.id}
              derivacion={{ pacienteId: paciente.id }}
              onGuardado={() => {
                setDerivada(`${paciente.nombre} ${paciente.apellido}`)
                setPaciente(null)
                setBusqueda('')
              }}
            />
          ) : (
            <p className="text-sm text-slate-500">Primero elegí el paciente.</p>
          )}
        </Tarjeta>
      </div>
    </>
  )
}
