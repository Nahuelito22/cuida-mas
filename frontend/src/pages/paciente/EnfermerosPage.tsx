import { useState } from 'react'
import { enfermerosApi } from '../../api/servicios'
import { FiltrosEnfermeros, type Filtro } from '../../components/enfermeros/FiltrosEnfermeros'
import { TarjetaEnfermero } from '../../components/enfermeros/TarjetaEnfermero'
import { Cargando } from '../../components/ui/Spinner'
import { Alerta, EncabezadoPagina, EstadoVacio } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import { useDebounce } from '../../hooks/useDebounce'

/** Directorio público (para usuarios logueados) de enfermeros verificados. */
export function EnfermerosPage() {
  const [filtro, setFiltro] = useState<Filtro>({ zonaId: '', practicaId: '', q: '' })
  // Evita una petición por cada tecla mientras se escribe.
  const q = useDebounce(filtro.q)
  const { datos, cargando, error } = useCarga(
    () => enfermerosApi.buscar({ zonaId: filtro.zonaId, practicaId: filtro.practicaId, q }),
    [filtro.zonaId, filtro.practicaId, q],
  )

  return (
    <>
      <EncabezadoPagina titulo="Enfermeros" descripcion="Profesionales con matrícula verificada por el centro de salud." />
      <FiltrosEnfermeros filtro={filtro} onChange={setFiltro} />
      {cargando && !datos && <Cargando />}
      {error && <Alerta>{error}</Alerta>}
      {datos && datos.length === 0 && <EstadoVacio titulo="No encontramos enfermeros" descripcion="Probá con otra zona o práctica." />}
      {datos && datos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datos.map((e) => (
            <TarjetaEnfermero key={e.id} enfermero={e} />
          ))}
        </div>
      )}
    </>
  )
}
