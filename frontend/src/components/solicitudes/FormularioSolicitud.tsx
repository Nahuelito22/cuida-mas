import { useState, type FormEvent } from 'react'
import { practicasApi, solicitudesApi, zonasApi, type DatosSolicitud } from '../../api/servicios'
import { useCarga } from '../../hooks/useCarga'
import type { Solicitud } from '../../types'
import { aInputFecha, hoyInputFecha } from '../../utils/formato'
import { validarSolicitud, type Errores as ErroresDe } from '../../utils/validaciones'
import { Boton } from '../ui/Boton'
import { CampoArea, CampoSelect, CampoTexto, SelectorMultiple } from '../ui/Campos'
import { Cargando } from '../ui/Spinner'
import { Alerta } from '../ui/Tarjeta'

const FRECUENCIAS = ['Diaria', 'Cada 12 horas', 'Día por medio', 'Lunes, miércoles y viernes', 'Semanal', 'Cada 15 días']

interface Props {
  /** Si viene, el formulario edita esa solicitud. */
  solicitud?: Solicitud
  /** Derivación del centro de salud: paciente elegido por el ADMIN. */
  derivacion?: { pacienteId: string }
  onGuardado: (s: Solicitud) => void
  onCancelar?: () => void
}

type Errores = ErroresDe<DatosSolicitud>

export function FormularioSolicitud({ solicitud, derivacion, onGuardado, onCancelar }: Props) {
  const catalogos = useCarga(() => Promise.all([zonasApi.listar(), practicasApi.listar(true)]))
  const [datos, setDatos] = useState<DatosSolicitud>({
    zonaId: solicitud?.zona.id ?? '',
    practicaIds: solicitud?.practicas.map((p) => p.id) ?? [],
    direccion: solicitud?.direccion ?? '',
    fechaInicio: aInputFecha(solicitud?.fechaInicio) || hoyInputFecha(),
    fechaFin: aInputFecha(solicitud?.fechaFin),
    frecuencia: solicitud?.frecuencia ?? 'Diaria',
    observaciones: solicitud?.observaciones ?? '',
    centroOrigen: solicitud?.centroOrigen ?? '',
  })
  const [errores, setErrores] = useState<Errores>({})
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = <K extends keyof DatosSolicitud>(campo: K, valor: DatosSolicitud[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }))

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const nuevosErrores = validarSolicitud(datos)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length) return

    setGuardando(true)
    setErrorServidor(null)
    const payload: DatosSolicitud = {
      ...datos,
      observaciones: datos.observaciones?.trim() || undefined,
      centroOrigen: derivacion ? datos.centroOrigen?.trim() || undefined : undefined,
    }
    try {
      const guardada = solicitud
        ? await solicitudesApi.actualizar(solicitud.id, payload)
        : await solicitudesApi.crear({ ...payload, pacienteId: derivacion?.pacienteId })
      onGuardado(guardada)
    } catch (err) {
      setErrorServidor(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (catalogos.cargando) return <Cargando />
  if (catalogos.error || !catalogos.datos) return <Alerta>{catalogos.error}</Alerta>
  const [zonas, practicas] = catalogos.datos

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {errorServidor && <Alerta>{errorServidor}</Alerta>}

      {derivacion && (
        <CampoTexto
          etiqueta="Centro que da el alta"
          placeholder="Ej: Hospital Central - Cirugía"
          value={datos.centroOrigen}
          onChange={(e) => cambiar('centroOrigen', e.target.value)}
        />
      )}

      <SelectorMultiple
        etiqueta="Prácticas necesarias"
        opciones={practicas.map((p) => ({ id: p.id, etiqueta: p.nombre, detalle: `${p.duracionEstimadaMin} min` }))}
        seleccionados={datos.practicaIds}
        onChange={(ids) => cambiar('practicaIds', ids)}
        error={errores.practicaIds}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect etiqueta="Zona" value={datos.zonaId} onChange={(e) => cambiar('zonaId', e.target.value)} error={errores.zonaId}>
          <option value="">Seleccioná una zona</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre} ({z.departamento})
            </option>
          ))}
        </CampoSelect>
        <CampoTexto
          etiqueta="Dirección"
          placeholder="Calle, número, barrio"
          value={datos.direccion}
          onChange={(e) => cambiar('direccion', e.target.value)}
          error={errores.direccion}
        />
        <CampoTexto etiqueta="Desde" type="date" value={datos.fechaInicio} onChange={(e) => cambiar('fechaInicio', e.target.value)} error={errores.fechaInicio} />
        <CampoTexto etiqueta="Hasta" type="date" min={datos.fechaInicio} value={datos.fechaFin} onChange={(e) => cambiar('fechaFin', e.target.value)} error={errores.fechaFin} />
      </div>

      <CampoTexto
        etiqueta="Frecuencia"
        list="frecuencias"
        value={datos.frecuencia}
        onChange={(e) => cambiar('frecuencia', e.target.value)}
        error={errores.frecuencia}
        ayuda="Elegí una opción o escribí la tuya"
      />
      <datalist id="frecuencias">
        {FRECUENCIAS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <CampoArea
        etiqueta="Observaciones (opcional)"
        placeholder="Indicaciones médicas, horarios, cómo llegar..."
        value={datos.observaciones}
        onChange={(e) => cambiar('observaciones', e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-2">
        {onCancelar && (
          <Boton variante="secundario" onClick={onCancelar}>
            Cancelar
          </Boton>
        )}
        <Boton type="submit" cargando={guardando}>
          {solicitud ? 'Guardar cambios' : derivacion ? 'Derivar paciente' : 'Pedir cuidados'}
        </Boton>
      </div>
    </form>
  )
}
