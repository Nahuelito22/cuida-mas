import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { practicasApi, type DatosPractica } from '../../api/servicios'
import { Boton } from '../../components/ui/Boton'
import { CampoArea, CampoTexto } from '../../components/ui/Campos'
import { Confirmar } from '../../components/ui/Confirmar'
import { Insignia } from '../../components/ui/Insignias'
import { Modal } from '../../components/ui/Modal'
import { Cargando } from '../../components/ui/Spinner'
import { Tabla } from '../../components/ui/Tabla'
import { Alerta, EncabezadoPagina } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import type { Practica } from '../../types'

/** Catálogo de prácticas: CRUD completo consumido por GraphQL. */
export function PracticasPage() {
  const { datos, cargando, error, recargar } = useCarga(() => practicasApi.listar())
  const [editando, setEditando] = useState<Practica | 'nueva' | null>(null)
  const [aEliminar, setAEliminar] = useState<Practica | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const alternarActiva = async (p: Practica) => {
    setErrorAccion(null)
    try {
      await practicasApi.actualizar(p.id, { activa: !p.activa })
      await recargar()
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo actualizar')
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Prácticas"
        descripcion="Catálogo de prácticas de enfermería domiciliaria (gestionado por GraphQL)."
        acciones={
          <Boton icono={<Plus className="size-4" />} onClick={() => setEditando('nueva')}>
            Nueva práctica
          </Boton>
        }
      />
      {errorAccion && (
        <div className="mb-4">
          <Alerta>{errorAccion}</Alerta>
        </div>
      )}
      {cargando && !datos && <Cargando />}
      {error && <Alerta>{error}</Alerta>}
      {datos && (
        <Tabla
          filas={datos}
          clave={(p) => p.id}
          columnas={[
            {
              titulo: 'Práctica',
              celda: (p) => (
                <>
                  <span className="font-medium text-slate-900">{p.nombre}</span>
                  {p.descripcion && <span className="block text-xs text-slate-500">{p.descripcion}</span>}
                </>
              ),
            },
            { titulo: 'Duración', celda: (p) => `${p.duracionEstimadaMin} min` },
            {
              titulo: 'Estado',
              celda: (p) => (
                <button onClick={() => alternarActiva(p)} title="Cambiar estado">
                  <Insignia color={p.activa ? 'verde' : 'gris'}>{p.activa ? 'Activa' : 'Inactiva'}</Insignia>
                </button>
              ),
            },
            {
              titulo: 'Acciones',
              celda: (p) => (
                <div className="flex justify-end gap-1 md:justify-start">
                  <button onClick={() => setEditando(p)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label={`Editar ${p.nombre}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => setAEliminar(p)} className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${p.nombre}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {editando && (
        <ModalPractica
          practica={editando === 'nueva' ? undefined : editando}
          onCerrar={() => setEditando(null)}
          onGuardada={async () => {
            setEditando(null)
            await recargar()
          }}
        />
      )}
      {aEliminar && (
        <Confirmar
          titulo="Eliminar práctica"
          mensaje={
            <>
              ¿Eliminar <strong>{aEliminar.nombre}</strong>? Si la usan enfermeros o solicitudes no se va a poder borrar: en ese caso desactivala.
            </>
          }
          textoConfirmar="Eliminar"
          peligro
          onCerrar={() => setAEliminar(null)}
          onConfirmar={async () => {
            await practicasApi.eliminar(aEliminar.id)
            await recargar()
          }}
        />
      )}
    </>
  )
}

function ModalPractica({ practica, onCerrar, onGuardada }: { practica?: Practica; onCerrar: () => void; onGuardada: () => Promise<void> }) {
  const [datos, setDatos] = useState<DatosPractica>({
    nombre: practica?.nombre ?? '',
    descripcion: practica?.descripcion ?? '',
    duracionEstimadaMin: practica?.duracionEstimadaMin ?? 30,
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!datos.nombre.trim()) nuevos.nombre = 'Obligatorio'
    if (!Number.isInteger(datos.duracionEstimadaMin) || datos.duracionEstimadaMin < 5 || datos.duracionEstimadaMin > 480) {
      nuevos.duracion = 'Entre 5 y 480 minutos'
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setGuardando(true)
    setError(null)
    const input = { ...datos, descripcion: datos.descripcion?.trim() || undefined }
    try {
      if (practica) await practicasApi.actualizar(practica.id, input)
      else await practicasApi.crear(input)
      await onGuardada()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
      setGuardando(false)
    }
  }

  return (
    <Modal abierto titulo={practica ? 'Editar práctica' : 'Nueva práctica'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alerta>{error}</Alerta>}
        <CampoTexto etiqueta="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} error={errores.nombre} />
        <CampoTexto
          etiqueta="Duración estimada (minutos)"
          type="number"
          min={5}
          max={480}
          value={datos.duracionEstimadaMin}
          onChange={(e) => setDatos({ ...datos, duracionEstimadaMin: Number(e.target.value) })}
          error={errores.duracion}
        />
        <CampoArea etiqueta="Descripción (opcional)" value={datos.descripcion} onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando}>
            Guardar
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
