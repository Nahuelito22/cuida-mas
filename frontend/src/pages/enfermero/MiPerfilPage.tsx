import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/cliente'
import { enfermerosApi, practicasApi, zonasApi, type DatosPerfil } from '../../api/servicios'
import { Boton } from '../../components/ui/Boton'
import { CampoArea, CampoTexto, SelectorMultiple } from '../../components/ui/Campos'
import { Estrellas } from '../../components/ui/Insignias'
import { Cargando } from '../../components/ui/Spinner'
import { Alerta, EncabezadoPagina, Tarjeta } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import type { Enfermero, Practica, Zona } from '../../types'
import { formatearFecha } from '../../utils/formato'
import type { Errores } from '../../utils/validaciones'

export function MiPerfilPage() {
  const carga = useCarga(async () => {
    const [zonas, practicas, perfil] = await Promise.all([
      zonasApi.listar(),
      practicasApi.listar(true),
      // Si todavía no tiene perfil, el backend responde 404.
      enfermerosApi.miPerfil().catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }),
    ])
    return { zonas, practicas, perfil }
  })
  const [guardado, setGuardado] = useState<Enfermero | null>(null)
  const perfil = guardado ?? carga.datos?.perfil ?? null
  const resenas = useCarga(() => (perfil ? enfermerosApi.resenas(perfil.id) : Promise.resolve([])), [perfil?.id])

  if (carga.cargando && !carga.datos) return <Cargando />
  if (carga.error || !carga.datos) return <Alerta>{carga.error}</Alerta>

  return (
    <>
      <EncabezadoPagina titulo="Mi perfil profesional" descripcion="Indicá dónde atendés y qué prácticas realizás." />

      <div className="mb-5">
        {!perfil && <Alerta tipo="info">Completá tu perfil para empezar a recibir solicitudes de tu zona.</Alerta>}
        {perfil && !perfil.verificado && (
          <Alerta tipo="info">Tu matrícula está pendiente de verificación por el centro de salud. Mientras tanto no vas a ver solicitudes.</Alerta>
        )}
        {perfil?.verificado && <Alerta tipo="exito">Matrícula verificada. Ya podés aceptar solicitudes compatibles con tu perfil.</Alerta>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <FormularioPerfil perfil={perfil} zonas={carga.datos.zonas} practicas={carga.datos.practicas} onGuardado={setGuardado} />
        </Tarjeta>

        <Tarjeta>
          <h2 className="font-semibold text-slate-900">Reseñas recibidas</h2>
          {perfil && (
            <div className="mt-2">
              <Estrellas puntaje={perfil.puntajePromedio} cantidad={perfil.cantidadResenas} />
            </div>
          )}
          <ul className="mt-4 space-y-4">
            {resenas.datos?.map((r) => (
              <li key={r.id} className="border-t border-slate-100 pt-3 text-sm">
                <Estrellas puntaje={r.puntaje} />
                {r.comentario && <p className="mt-1 text-slate-600">"{r.comentario}"</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {r.pacienteNombre} · {formatearFecha(r.createdAt)}
                </p>
              </li>
            ))}
            {resenas.datos?.length === 0 && <li className="text-sm text-slate-500">Todavía no tenés reseñas.</li>}
          </ul>
        </Tarjeta>
      </div>
    </>
  )
}

interface PropsFormulario {
  perfil: Enfermero | null
  zonas: Zona[]
  practicas: Practica[]
  onGuardado: (perfil: Enfermero) => void
}

function FormularioPerfil({ perfil, zonas, practicas, onGuardado }: PropsFormulario) {
  // El estado inicial sale del perfil cargado; no hace falta sincronizarlo con un efecto.
  const [datos, setDatos] = useState<DatosPerfil>(() => ({
    matricula: perfil?.matricula ?? '',
    telefono: perfil?.telefono ?? '',
    bio: perfil?.bio ?? '',
    zonaIds: perfil?.zonas.map((z) => z.id) ?? [],
    practicaIds: perfil?.practicas.map((p) => p.id) ?? [],
  }))
  const [errores, setErrores] = useState<Errores<DatosPerfil>>({})
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const nuevos: Errores<DatosPerfil> = {}
    if (!/^[A-Za-z0-9-]{3,20}$/.test(datos.matricula)) nuevos.matricula = 'Solo letras, números y guiones (3 a 20)'
    if (!datos.zonaIds.length) nuevos.zonaIds = 'Elegí al menos una zona'
    if (!datos.practicaIds.length) nuevos.practicaIds = 'Elegí al menos una práctica'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setGuardando(true)
    setMensaje(null)
    try {
      const guardado = await enfermerosApi.guardarPerfil({
        ...datos,
        telefono: datos.telefono || undefined,
        bio: datos.bio || undefined,
      })
      onGuardado(guardado)
      setMensaje({ tipo: 'exito', texto: 'Perfil guardado.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo guardar' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          etiqueta="Matrícula profesional"
          value={datos.matricula}
          onChange={(e) => setDatos({ ...datos, matricula: e.target.value })}
          error={errores.matricula}
          ayuda="Si la cambiás, se vuelve a verificar"
        />
        <CampoTexto etiqueta="Teléfono de contacto" type="tel" value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} />
      </div>
      <CampoArea etiqueta="Presentación" placeholder="Experiencia, especialidades, horarios..." value={datos.bio} onChange={(e) => setDatos({ ...datos, bio: e.target.value })} />
      <SelectorMultiple
        etiqueta="Zonas que atendés"
        opciones={zonas.map((z) => ({ id: z.id, etiqueta: z.nombre, detalle: z.departamento }))}
        seleccionados={datos.zonaIds}
        onChange={(zonaIds) => setDatos({ ...datos, zonaIds })}
        error={errores.zonaIds}
      />
      <SelectorMultiple
        etiqueta="Prácticas que realizás"
        opciones={practicas.map((p) => ({ id: p.id, etiqueta: p.nombre }))}
        seleccionados={datos.practicaIds}
        onChange={(practicaIds) => setDatos({ ...datos, practicaIds })}
        error={errores.practicaIds}
      />
      <div className="flex justify-end">
        <Boton type="submit" cargando={guardando}>
          Guardar perfil
        </Boton>
      </div>
    </form>
  )
}
