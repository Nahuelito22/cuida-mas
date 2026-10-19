import { useState, type FormEvent } from 'react'
import { CheckCircle2, NotebookPen, Plus } from 'lucide-react'
import { solicitudesApi } from '../../api/servicios'
import { ModalBitacora } from '../../components/solicitudes/ModalBitacora'
import { GrillaSolicitudes, TarjetaSolicitud } from '../../components/solicitudes/TarjetaSolicitud'
import { Boton } from '../../components/ui/Boton'
import { CampoArea, CampoTexto, SelectorMultiple } from '../../components/ui/Campos'
import { Confirmar } from '../../components/ui/Confirmar'
import { FiltroEstados } from '../../components/ui/FiltroEstados'
import { Modal } from '../../components/ui/Modal'
import { Cargando } from '../../components/ui/Spinner'
import { Alerta, EncabezadoPagina, EstadoVacio } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import type { EstadoSolicitud, Solicitud } from '../../types'

type Accion = { tipo: 'visita' | 'bitacora' | 'finalizar'; solicitud: Solicitud }

export function AsignadasPage() {
  const [estado, setEstado] = useState<EstadoSolicitud | ''>('')
  const { datos, cargando, error, recargar } = useCarga(
    () => solicitudesApi.listar({ vista: 'asignadas', ...(estado ? { estado } : {}) }),
    [estado],
  )
  const [accion, setAccion] = useState<Accion | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  return (
    <>
      <EncabezadoPagina titulo="Mis pacientes" descripcion="Planes de cuidado que aceptaste. Registrá cada visita en la bitácora." />
      {aviso && (
        <div className="mb-4">
          <Alerta tipo="exito">{aviso}</Alerta>
        </div>
      )}
      <FiltroEstados valor={estado} onChange={setEstado} />

      {cargando && <Cargando />}
      {error && <Alerta>{error}</Alerta>}
      {datos && datos.length === 0 && <EstadoVacio titulo="No tenés pacientes en este estado" descripcion="Aceptá solicitudes desde la sección Disponibles." />}
      {datos && datos.length > 0 && (
        <GrillaSolicitudes>
          {datos.map((s) => (
            <TarjetaSolicitud
              key={s.id}
              solicitud={s}
              mostrarPaciente
              acciones={
                <>
                  {['ACEPTADA', 'EN_CURSO'].includes(s.estado) && (
                    <Boton tamanio="sm" icono={<Plus className="size-4" />} onClick={() => setAccion({ tipo: 'visita', solicitud: s })}>
                      Registrar visita
                    </Boton>
                  )}
                  <Boton tamanio="sm" variante="secundario" icono={<NotebookPen className="size-4" />} onClick={() => setAccion({ tipo: 'bitacora', solicitud: s })}>
                    Bitácora
                  </Boton>
                  {s.estado === 'EN_CURSO' && (
                    <Boton tamanio="sm" variante="fantasma" icono={<CheckCircle2 className="size-4" />} onClick={() => setAccion({ tipo: 'finalizar', solicitud: s })}>
                      Finalizar
                    </Boton>
                  )}
                </>
              }
            />
          ))}
        </GrillaSolicitudes>
      )}

      {accion?.tipo === 'visita' && (
        <ModalVisita
          solicitud={accion.solicitud}
          onCerrar={() => setAccion(null)}
          onGuardada={async () => {
            setAccion(null)
            setAviso(`Visita registrada para ${accion.solicitud.pacienteNombre}.`)
            await recargar()
          }}
        />
      )}
      {accion?.tipo === 'bitacora' && <ModalBitacora solicitud={accion.solicitud} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'finalizar' && (
        <Confirmar
          titulo="Finalizar plan de cuidados"
          mensaje="El paciente podrá calificar la atención y no se podrán registrar más visitas."
          textoConfirmar="Finalizar"
          onCerrar={() => setAccion(null)}
          onConfirmar={async () => {
            await solicitudesApi.finalizar(accion.solicitud.id)
            setAviso('Plan finalizado.')
            await recargar()
          }}
        />
      )}
    </>
  )
}

function ModalVisita({ solicitud, onCerrar, onGuardada }: { solicitud: Solicitud; onCerrar: () => void; onGuardada: () => Promise<void> }) {
  const [practicaIds, setPracticaIds] = useState(solicitud.practicas.map((p) => p.id))
  const [observaciones, setObservaciones] = useState('')
  const [presion, setPresion] = useState('')
  const [temperatura, setTemperatura] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!observaciones.trim()) nuevos.observaciones = 'Describí cómo fue la visita'
    if (presion && !/^\d{2,3}\/\d{2,3}$/.test(presion)) nuevos.presion = 'Formato: 120/80'
    const temp = temperatura ? Number(temperatura.replace(',', '.')) : undefined
    if (temp !== undefined && (Number.isNaN(temp) || temp < 30 || temp > 45)) nuevos.temperatura = 'Entre 30 y 45 °C'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setGuardando(true)
    setError(null)
    try {
      await solicitudesApi.registrarVisita(solicitud.id, {
        observaciones,
        practicaIds,
        presionArterial: presion || undefined,
        temperatura: temp,
      })
      await onGuardada()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar')
      setGuardando(false)
    }
  }

  return (
    <Modal abierto titulo={`Nueva visita — ${solicitud.pacienteNombre}`} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alerta>{error}</Alerta>}
        <SelectorMultiple
          etiqueta="Prácticas realizadas"
          opciones={solicitud.practicas.map((p) => ({ id: p.id, etiqueta: p.nombre }))}
          seleccionados={practicaIds}
          onChange={setPracticaIds}
        />
        <CampoArea etiqueta="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} error={errores.observaciones} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="Presión arterial (opcional)" placeholder="120/80" value={presion} onChange={(e) => setPresion(e.target.value)} error={errores.presion} />
          <CampoTexto
            etiqueta="Temperatura °C (opcional)"
            inputMode="decimal"
            placeholder="36.5"
            value={temperatura}
            onChange={(e) => setTemperatura(e.target.value)}
            error={errores.temperatura}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando}>
            Guardar visita
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
