import { useState } from 'react'
import { NotebookPen, Pencil, Plus, Star, Trash2, XCircle } from 'lucide-react'
import { solicitudesApi } from '../../api/servicios'
import { FormularioSolicitud } from '../../components/solicitudes/FormularioSolicitud'
import { ModalBitacora } from '../../components/solicitudes/ModalBitacora'
import { GrillaSolicitudes, TarjetaSolicitud } from '../../components/solicitudes/TarjetaSolicitud'
import { Boton } from '../../components/ui/Boton'
import { CampoArea } from '../../components/ui/Campos'
import { Confirmar } from '../../components/ui/Confirmar'
import { FiltroEstados } from '../../components/ui/FiltroEstados'
import { Modal } from '../../components/ui/Modal'
import { Cargando } from '../../components/ui/Spinner'
import { Alerta, EncabezadoPagina, EstadoVacio } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import type { EstadoSolicitud, Solicitud } from '../../types'

type Accion =
  | { tipo: 'nueva' }
  | { tipo: 'editar' | 'bitacora' | 'cancelar' | 'eliminar' | 'calificar'; solicitud: Solicitud }

export function MisSolicitudesPage() {
  const [estado, setEstado] = useState<EstadoSolicitud | ''>('')
  const { datos, cargando, error, recargar } = useCarga(
    () => solicitudesApi.listar(estado ? { estado } : {}),
    [estado],
  )
  const [accion, setAccion] = useState<Accion | null>(null)
  const [motivo, setMotivo] = useState('')
  const [puntaje, setPuntaje] = useState(5)
  const [comentario, setComentario] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)

  const cerrar = () => {
    setAccion(null)
    setMotivo('')
    setComentario('')
    setPuntaje(5)
  }
  const tras = (mensaje: string) => async () => {
    setAviso(mensaje)
    await recargar()
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Mis cuidados"
        descripcion="Pedí enfermería a domicilio y seguí cada visita en la bitácora."
        acciones={
          <Boton icono={<Plus className="size-4" />} onClick={() => setAccion({ tipo: 'nueva' })}>
            Pedir cuidados
          </Boton>
        }
      />

      {aviso && (
        <div className="mb-4">
          <Alerta tipo="exito">{aviso}</Alerta>
        </div>
      )}
      <FiltroEstados valor={estado} onChange={setEstado} />

      {cargando && <Cargando />}
      {error && <Alerta>{error}</Alerta>}
      {datos && datos.length === 0 && (
        <EstadoVacio
          titulo="No hay solicitudes"
          descripcion="Cuando pidas cuidados o el centro de salud te derive, van a aparecer acá."
        />
      )}
      {datos && datos.length > 0 && (
        <GrillaSolicitudes>
          {datos.map((s) => (
            <TarjetaSolicitud
              key={s.id}
              solicitud={s}
              acciones={
                <>
                  {['ACEPTADA', 'EN_CURSO', 'FINALIZADA'].includes(s.estado) && (
                    <Boton tamanio="sm" variante="secundario" icono={<NotebookPen className="size-4" />} onClick={() => setAccion({ tipo: 'bitacora', solicitud: s })}>
                      Bitácora
                    </Boton>
                  )}
                  {s.estado === 'PENDIENTE' && (
                    <Boton tamanio="sm" variante="secundario" icono={<Pencil className="size-4" />} onClick={() => setAccion({ tipo: 'editar', solicitud: s })}>
                      Editar
                    </Boton>
                  )}
                  {s.estado === 'FINALIZADA' && (
                    <Boton tamanio="sm" icono={<Star className="size-4" />} onClick={() => setAccion({ tipo: 'calificar', solicitud: s })}>
                      Calificar
                    </Boton>
                  )}
                  {['PENDIENTE', 'ACEPTADA'].includes(s.estado) && (
                    <Boton tamanio="sm" variante="fantasma" icono={<XCircle className="size-4" />} onClick={() => setAccion({ tipo: 'cancelar', solicitud: s })}>
                      Cancelar
                    </Boton>
                  )}
                  {['PENDIENTE', 'CANCELADA'].includes(s.estado) && (
                    <Boton tamanio="sm" variante="fantasma" icono={<Trash2 className="size-4" />} onClick={() => setAccion({ tipo: 'eliminar', solicitud: s })}>
                      Eliminar
                    </Boton>
                  )}
                </>
              }
            />
          ))}
        </GrillaSolicitudes>
      )}

      {(accion?.tipo === 'nueva' || accion?.tipo === 'editar') && (
        <Modal abierto titulo={accion.tipo === 'nueva' ? 'Pedir cuidados a domicilio' : 'Editar solicitud'} onCerrar={cerrar} ancho="lg">
          <FormularioSolicitud
            solicitud={accion.tipo === 'editar' ? accion.solicitud : undefined}
            onCancelar={cerrar}
            onGuardado={() => {
              cerrar()
              void tras(accion.tipo === 'nueva' ? 'Solicitud enviada. Te avisamos cuando un enfermero la acepte.' : 'Cambios guardados.')()
            }}
          />
        </Modal>
      )}

      {accion?.tipo === 'bitacora' && <ModalBitacora solicitud={accion.solicitud} onCerrar={cerrar} />}

      {accion?.tipo === 'cancelar' && (
        <Confirmar
          titulo="Cancelar solicitud"
          mensaje="El enfermero asignado (si lo hay) deja de ver esta solicitud."
          textoConfirmar="Cancelar solicitud"
          peligro
          onCerrar={cerrar}
          onConfirmar={async () => {
            await solicitudesApi.cancelar(accion.solicitud.id, motivo || undefined)
            await tras('Solicitud cancelada.')()
          }}
        >
          <CampoArea etiqueta="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Confirmar>
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
            await tras('Solicitud eliminada.')()
          }}
        />
      )}

      {accion?.tipo === 'calificar' && (
        <Confirmar
          titulo="Calificar la atención"
          mensaje={`¿Cómo fue la atención de ${accion.solicitud.enfermero?.nombre ?? 'el enfermero'}?`}
          textoConfirmar="Enviar calificación"
          onCerrar={cerrar}
          onConfirmar={async () => {
            await solicitudesApi.calificar(accion.solicitud.id, puntaje, comentario || undefined)
            await tras('¡Gracias por tu calificación!')()
          }}
        >
          <div className="flex gap-1" role="radiogroup" aria-label="Puntaje">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={puntaje === n}
                aria-label={`${n} estrellas`}
                onClick={() => setPuntaje(n)}
                className={`text-3xl ${n <= puntaje ? 'text-amber-400' : 'text-slate-200'}`}
              >
                ★
              </button>
            ))}
          </div>
          <CampoArea etiqueta="Comentario (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </Confirmar>
      )}
    </>
  )
}
