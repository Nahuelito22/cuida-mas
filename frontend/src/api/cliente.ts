/**
 * Cliente HTTP único para REST (/api) y GraphQL (/graphql).
 * Agrega el token, normaliza los errores y avisa cuando la sesión venció.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let obtenerToken: () => string | null = () => null
let alExpirarSesion: () => void = () => {}

/** Lo llama el AuthContext para conectar el cliente con la sesión. */
export function configurarCliente(opciones: {
  obtenerToken: () => string | null
  alExpirarSesion: () => void
}) {
  obtenerToken = opciones.obtenerToken
  alExpirarSesion = opciones.alExpirarSesion
}

function headers(): HeadersInit {
  const token = obtenerToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function manejarNoAutorizado(status: number) {
  if (status === 401 && obtenerToken()) alExpirarSesion()
}

async function fetchSeguro(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

export async function api<T>(
  ruta: string,
  opciones: { method?: string; body?: unknown; query?: Query } = {},
): Promise<T> {
  const params = new URLSearchParams()
  Object.entries(opciones.query ?? {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(clave, String(valor))
    }
  })
  const qs = params.size ? `?${params}` : ''

  const res = await fetchSeguro(`${BASE_URL}/api${ruta}${qs}`, {
    method: opciones.method ?? 'GET',
    headers: headers(),
    body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
  })
  const data: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    manejarNoAutorizado(res.status)
    const mensaje = (data as { message?: string | string[] } | null)?.message
    throw new ApiError(
      Array.isArray(mensaje) ? mensaje.join('. ') : (mensaje ?? 'Ocurrió un error'),
      res.status,
    )
  }
  return data as T
}

interface RespuestaGraphQL<T> {
  data?: T
  errors?: { message: string; extensions?: { status?: number } }[]
}

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetchSeguro(`${BASE_URL}/graphql`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  })
  const body = (await res.json().catch(() => ({}))) as RespuestaGraphQL<T>

  const error = body.errors?.[0]
  if (error) {
    const status = error.extensions?.status ?? res.status ?? 400
    manejarNoAutorizado(status)
    throw new ApiError(error.message, status)
  }
  if (!res.ok || !body.data) {
    throw new ApiError('Ocurrió un error', res.status)
  }
  return body.data
}
