import { useState } from 'react'
import { BadgeCheck, ShieldOff } from 'lucide-react'
import { enfermerosApi } from '../../api/servicios'
import { FiltrosEnfermeros, type Filtro } from '../../components/enfermeros/FiltrosEnfermeros'
import { TarjetaEnfermero } from '../../components/enfermeros/TarjetaEnfermero'
import { Boton } from '../../components/ui/Boton'
import { Cargando } from '../../components/ui/Spinner'
import { Alerta, EncabezadoPagina, EstadoVacio } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import { useDebounce } from '../../hooks/useDebounce'

type Vista = 'pendientes' | 'verificados' | 'todos'

const VISTAS: { valor: Vista; texto: string }[] = [
  { valor: 'pendientes', texto: 'Pendientes de verificar' },
  { valor: 'verificados', texto: 'Verificados' },
  { valor: 'todos', texto: 'Todos' },
]

/** El centro de salud controla la matrícula de cada enfermero antes de habilitarlo. */
export function VerificacionesPage() {
  const [vista, setVista] = useState<Vista>('pendientes')
  const [filtro, setFiltro] = useState<Filtro>({ zonaId: '', practicaId: '', q: '' })
  const q = useDebounce(filtro.q)
  const { datos, cargando, error, recargar } = useCarga(
    () =>
      enfermerosApi.buscar({
        zonaId: filtro.zonaId,
        practicaId: filtro.practicaId,
        q,
        verificado: vista === 'todos' ? undefined : vista === 'verificados',
      }),
    [vista, filtro.zonaId, filtro.practicaId, q],
  )
  const [procesando, setProcesando] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const cambiarVerificacion = async (id: string, verificado: boolean) => {
    setProcesando(id)
    setErrorAccion(null)
    try {
      await enfermerosApi.verificar(id, verificado)
      await recargar()
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo actualizar')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Enfermeros" descripcion="Verificá la matrícula de cada profesional para habilitarlo a tomar solicitudes." />

      <div className="mb-4 inline-flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
        {VISTAS.map((v) => (
          <button
            key={v.valor}
            role="tab"
            aria-selected={vista === v.valor}
            onClick={() => setVista(v.valor)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${vista === v.valor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {v.texto}
          </button>
        ))}
      </div>
      <FiltrosEnfermeros filtro={filtro} onChange={setFiltro} />

      {errorAccion && (
        <div className="mb-4">
          <Alerta>{errorAccion}</Alerta>
        </div>
      )}
      {cargando && !datos && <Cargando />}
      {error && <Alerta>{error}</Alerta>}
      {datos && datos.length === 0 && <EstadoVacio titulo="No hay enfermeros en esta vista" />}
      {datos && datos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datos.map((e) => (
            <TarjetaEnfermero
              key={e.id}
              enfermero={e}
              acciones={
                e.verificado ? (
                  <Boton tamanio="sm" variante="secundario" icono={<ShieldOff className="size-4" />} cargando={procesando === e.id} onClick={() => cambiarVerificacion(e.id, false)}>
                    Quitar verificación
                  </Boton>
                ) : (
                  <Boton tamanio="sm" icono={<BadgeCheck className="size-4" />} cargando={procesando === e.id} onClick={() => cambiarVerificacion(e.id, true)}>
                    Verificar matrícula
                  </Boton>
                )
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
