import { useState, type FormEvent } from 'react'
import { zonasApi } from '../../api/servicios'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/ui/Campos'
import { Cargando } from '../../components/ui/Spinner'
import { Tabla } from '../../components/ui/Tabla'
import { Alerta, EncabezadoPagina, Tarjeta } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'

export function ZonasPage() {
  const { datos, cargando, error, recargar } = useCarga(zonasApi.listar)
  const [nombre, setNombre] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  const crear = async (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !departamento.trim()) {
      setMensaje({ tipo: 'error', texto: 'Completá nombre y departamento' })
      return
    }
    setGuardando(true)
    try {
      await zonasApi.crear({ nombre: nombre.trim(), departamento: departamento.trim() })
      setMensaje({ tipo: 'exito', texto: `Zona "${nombre.trim()}" creada.` })
      setNombre('')
      setDepartamento('')
      await recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo crear' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Zonas" descripcion="Zonas de cobertura donde los enfermeros pueden atender." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {cargando && !datos && <Cargando />}
          {error && <Alerta>{error}</Alerta>}
          {datos && (
            <Tabla
              filas={datos}
              clave={(z) => z.id}
              columnas={[
                { titulo: 'Zona', celda: (z) => <span className="font-medium text-slate-900">{z.nombre}</span> },
                { titulo: 'Departamento', celda: (z) => z.departamento },
              ]}
            />
          )}
        </div>
        <Tarjeta className="h-fit">
          <h2 className="font-semibold text-slate-900">Nueva zona</h2>
          <form onSubmit={crear} className="mt-4 space-y-4" noValidate>
            {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}
            <CampoTexto etiqueta="Nombre" placeholder="Ej: Barrio Cívico" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <CampoTexto etiqueta="Departamento" placeholder="Ej: Capital" value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
            <Boton type="submit" cargando={guardando} className="w-full">
              Agregar zona
            </Boton>
          </form>
        </Tarjeta>
      </div>
    </>
  )
}
