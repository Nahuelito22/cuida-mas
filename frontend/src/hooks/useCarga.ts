import { useCallback, useEffect, useRef, useState } from 'react'

interface Resultado<T> {
  datos: T | undefined
  cargando: boolean
  error: string | null
  recargar: () => void
}

/**
 * Carga datos asíncronos y expone loading/error/recargar.
 * `dependencias` funciona como en useEffect: si cambian, vuelve a cargar.
 * Mientras recarga se siguen mostrando los datos anteriores.
 */
export function useCarga<T>(
  cargar: () => Promise<T>,
  dependencias: unknown[] = [],
): Resultado<T> {
  const [version, setVersion] = useState(0)
  const clave = JSON.stringify([...dependencias, version])
  const [estado, setEstado] = useState<{ datos?: T; error: string | null; clave: string | null }>({
    error: null,
    clave: null,
  })

  // Siempre se usa la última función recibida, sin que forme parte de las dependencias.
  const cargarRef = useRef(cargar)
  useEffect(() => {
    cargarRef.current = cargar
  })

  useEffect(() => {
    let vigente = true
    cargarRef.current().then(
      (datos) => vigente && setEstado({ datos, error: null, clave }),
      (e: unknown) =>
        vigente &&
        setEstado((previo) => ({
          datos: previo.datos,
          error: e instanceof Error ? e.message : 'Ocurrió un error',
          clave,
        })),
    )
    // Si cambian los filtros antes de que llegue la respuesta, se descarta la vieja.
    return () => {
      vigente = false
    }
  }, [clave])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return {
    datos: estado.datos,
    error: estado.error,
    cargando: estado.clave !== clave,
    recargar,
  }
}
