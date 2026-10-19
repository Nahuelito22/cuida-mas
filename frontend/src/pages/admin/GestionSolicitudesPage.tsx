import { useState } from 'react'
import { CheckCircle2, NotebookPen, Pencil, Trash2, XCircle } from 'lucide-react'
import { solicitudesApi, zonasApi } from '../../api/servicios'
import { FormularioSolicitud } from '../../components/solicitudes/FormularioSolicitud'
import { ModalBitacora } from '../../components/solicitudes/ModalBitacora'
import { CampoSelect } from '../../components/ui/Campos'
import { Confirmar } from '../../components/ui/Confirmar'
import { FiltroEstados } from '../../components/ui/FiltroEstados'
import { Insignia, InsigniaEstado } from '../../components/ui/Insignias'
import { Modal } from '../../components/ui/Modal'
import { Cargando } from '../../components/ui/Spinner'
import { Tabla } from '../../components/ui/Tabla'
import { Alerta, EncabezadoPagina, EstadoVacio } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import type { EstadoSolicitud, Solicitud } from '../../types'
import { formatearFecha, nombreCompleto } from '../../utils/formato'

type Accion = { tipo: 'editar' | 'bitacora' | 'cancelar' | 'eliminar' | 'finalizar'; solicitud: Solicitud }

export function GestionSolicitudesPage() {
  const [estado, setEstado] = useState<EstadoSolicitud | ''>('')
  const [zonaId, setZonaId] = useState('')
  const zonas = useCarga(zonasApi.listar)
  const { datos, cargando, error, recargar } = useCarga(
    () => solicitudesApi.listar({ ...(estado ? { estado } : {}), ...(zonaId ? { zonaId } : {}) }),
    [estado, zonaId],
  )
  const [accion, setAccion] = useState<Accion | null>(null)
  const cerrar = () => setAccion(null)

  const botonAccion = (s: Solicitud, tipo: Accion['tipo'], etiqueta: string, Icono: typeof Pencil) => (
    <button
      onClick={() => setAccion({ tipo, solicitud: s })}
      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      title={etiqueta}
      aria-label={`${etiqueta} solicitud de ${s.pacienteNombre}`}
    >
      <Icono className="size-4" />
    </button>
  )

  return (
    <>
      <EncabezadoPagina titulo="Solicitudes" descripcion="Todas las solicitudes y derivaciones del sistema." />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <FiltroEstados valor={estado} onChange={setEstado} />
        <div className="mb-5 md:w-64">
          <CampoSelect etiqueta="Zona" value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
            <option value="">Todas las zonas</option>
            {zonas.datos?.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre} ({z.departamento})
              </option>
            ))}
          </CampoSelect>
        </div>
      </div>

      {cargando && !datos && <Cargando />}
      {error && <Alerta>{error}</Alerta>}
      {datos && (
        <Tabla
          filas={datos}
          clave={(s) => s.id}
          vacio={<EstadoVacio titulo="No hay solicitudes con esos filtros" />}
          columnas={[
            {
              titulo: 'Paciente',
              celda: (s) => (
                <>
                  <span className="font-medium text-slate-900">{s.pacienteNombre}</span>
                  {s.origen === 'DERIVACION' && (
                    <span className="mt-1 block">
                      <Insignia color="azul">Derivación</Insignia>
                    </span>
                  )}
                </>
              ),
            },
            { titulo: 'Prácticas', celda: (s) => s.practicas.map((p) => p.nombre).join(', ') },
            { titulo: 'Zona', celda: (s) => s.zona.nombre },
            { titulo: 'Período', celda: (s) => `${formatearFecha(s.fechaInicio)} – ${formatearFecha(s.fechaFin)}` },
            { titulo: 'Enfermero/a', celda: (s) => (s.enfermero ? nombreCompleto(s.enfermero) : <span className="text-slate-400">Sin asignar</span>) },
            { titulo: 'Estado', celda: (s) => <InsigniaEstado estado={s.estado} /> },
            {
              titulo: 'Acciones',
              celda: (s) => (
                <div className="flex justify-end gap-1 md:justify-start">
                  {s.estado !== 'PENDIENTE' && s.estado !== 'CANCELADA' && botonAccion(s, 'bitacora', 'Ver bitácora', NotebookPen)}
                  {s.estado === 'PENDIENTE' && botonAccion(s, 'editar', 'Editar', Pencil)}
                  {s.estado === 'EN_CURSO' && botonAccion(s, 'finalizar', 'Finalizar', CheckCircle2)}
                  {['PENDIENTE', 'ACEPTADA'].includes(s.estado) && botonAccion(s, 'cancelar', 'Cancelar', XCircle)}
                  {['PENDIENTE', 'CANCELADA'].includes(s.estado) && botonAccion(s, 'eliminar', 'Eliminar', Trash2)}
                </div>
              ),
            },
          ]}
        />
      )}

      {accion?.tipo === 'editar' && (
        <Modal abierto titulo={`Editar solicitud — ${accion.solicitud.pacienteNombre}`} onCerrar={cerrar} ancho="lg">
          <FormularioSolicitud
            solicitud={accion.solicitud}
            derivacion={accion.solicitud.origen === 'DERIVACION' ? { pacienteId: accion.solicitud.pacienteId } : undefined}
            onCancelar={cerrar}
            onGuardado={() => {
              cerrar()
              void recargar()
            }}
          />
        </Modal>
      )}
      {accion?.tipo === 'bitacora' && <ModalBitacora solicitud={accion.solicitud} onCerrar={cerrar} />}
      {accion?.tipo === 'cancelar' && (
        <Confirmar
          titulo="Cancelar solicitud"
          mensaje={`Se cancela el plan de ${accion.solicitud.pacienteNombre}.`}
          textoConfirmar="Cancelar solicitud"
          peligro
          onCerrar={cerrar}
          onConfirmar={async () => {
            await solicitudesApi.cancelar(accion.solicitud.id, 'Cancelada por el centro de salud')
            await recargar()
          }}
        />
      )}
      {accion?.tipo === 'eliminar' && (
        <Confirmar
          titulo="Eliminar solicitud"
          mensaje="Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          peligro
          onCerrar={cerrar}
          onConfirmar={async () => {
            await solicitudesApi.eliminar(accion.solicitud.id)
            await recargar()
          }}
        />
      )}
      {accion?.tipo === 'finalizar' && (
        <Confirmar
          titulo="Finalizar plan de cuidados"
          mensaje={`Se da por terminado el plan de ${accion.solicitud.pacienteNombre}.`}
          textoConfirmar="Finalizar"
          onCerrar={cerrar}
          onConfirmar={async () => {
            await solicitudesApi.finalizar(accion.solicitud.id)
            await recargar()
          }}
        />
      )}
    </>
  )
}
