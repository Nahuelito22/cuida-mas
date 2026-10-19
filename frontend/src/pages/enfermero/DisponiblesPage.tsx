import { useState } from 'react'
import { Link } from 'react-router'
import { HandHeart } from 'lucide-react'
import { ApiError } from '../../api/cliente'
import { enfermerosApi, solicitudesApi } from '../../api/servicios'
import { GrillaSolicitudes, TarjetaSolicitud } from '../../components/solicitudes/TarjetaSolicitud'
import { Boton } from '../../components/ui/Boton'
import { Confirmar } from '../../components/ui/Confirmar'
import { Cargando } from '../../components/ui/Spinner'
import { Alerta, EncabezadoPagina, EstadoVacio } from '../../components/ui/Tarjeta'
import { useCarga } from '../../hooks/useCarga'
import type { Solicitud } from '../../types'

/** Solicitudes pendientes en las zonas del enfermero y con prácticas que realiza. */
export function DisponiblesPage() {
  const { datos, cargando, error, recargar } = useCarga(async () => {
    const perfil = await enfermerosApi.miPerfil().catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    })
    const solicitudes = perfil?.verificado ? await solicitudesApi.listar({ vista: 'disponibles' }) : []
    return { perfil, solicitudes }
  })
  const [aAceptar, setAAceptar] = useState<Solicitud | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  return (
    <>
      <EncabezadoPagina titulo="Solicitudes disponibles" descripcion="Planes de cuidado pendientes en tus zonas y compatibles con tus prácticas." />
      {aviso && (
        <div className="mb-4">
          <Alerta tipo="exito">
            {aviso}{' '}
            <Link to="/app/asignadas" className="font-medium underline">
              Ver mis pacientes
            </Link>
          </Alerta>
        </div>
      )}

      {cargando && <Cargando />}
      {error && <Alerta>{error}</Alerta>}

      {datos && !datos.perfil && (
        <EstadoVacio
          titulo="Completá tu perfil profesional"
          descripcion="Necesitamos tu matrícula, zonas y prácticas para mostrarte solicitudes."
          accion={
            <Link to="/app/perfil" className="font-medium text-brand-600 hover:underline">
              Ir a mi perfil
            </Link>
          }
        />
      )}
      {datos?.perfil && !datos.perfil.verificado && (
        <EstadoVacio titulo="Matrícula pendiente de verificación" descripcion="Cuando el centro de salud verifique tu matrícula vas a ver las solicitudes acá." />
      )}
      {datos?.perfil?.verificado && datos.solicitudes.length === 0 && (
        <EstadoVacio titulo="No hay solicitudes disponibles" descripcion="Por ahora no hay pedidos pendientes en tus zonas." />
      )}
      {datos && datos.solicitudes.length > 0 && (
        <GrillaSolicitudes>
          {datos.solicitudes.map((s) => (
            <TarjetaSolicitud
              key={s.id}
              solicitud={s}
              mostrarPaciente
              acciones={
                <Boton tamanio="sm" icono={<HandHeart className="size-4" />} onClick={() => setAAceptar(s)}>
                  Aceptar
                </Boton>
              }
            />
          ))}
        </GrillaSolicitudes>
      )}

      {aAceptar && (
        <Confirmar
          titulo="Aceptar solicitud"
          mensaje={`Te comprometés a atender a ${aAceptar.pacienteNombre} (${aAceptar.frecuencia.toLowerCase()}) en ${aAceptar.direccion}.`}
          textoConfirmar="Aceptar"
          onCerrar={() => setAAceptar(null)}
          onConfirmar={async () => {
            await solicitudesApi.aceptar(aAceptar.id)
            setAviso(`Aceptaste el plan de ${aAceptar.pacienteNombre}.`)
            await recargar()
          }}
        />
      )}
    </>
  )
}
