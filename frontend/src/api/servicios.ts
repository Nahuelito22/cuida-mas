import { api, gql } from './cliente'
import type {
  CoberturaZona,
  Enfermero,
  EstadoSolicitud,
  Practica,
  Resena,
  Rol,
  Solicitud,
  Usuario,
  Visita,
  Zona,
} from '../types'

// ---------------- Autenticación (REST) ----------------

export interface DatosRegistro {
  email: string
  password: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  rol: Extract<Rol, 'PACIENTE' | 'ENFERMERO'>
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  registro: (datos: DatosRegistro) =>
    api<Usuario>('/auth/registro', { method: 'POST', body: datos }),
}

export const usuariosApi = {
  buscarPacientes: (q: string) =>
    api<Usuario[]>('/usuarios', { query: { rol: 'PACIENTE', q } }),
}

// ---------------- Zonas (REST) ----------------

export const zonasApi = {
  listar: () => api<Zona[]>('/zonas'),
  crear: (datos: Omit<Zona, 'id'>) =>
    api<Zona>('/zonas', { method: 'POST', body: datos }),
}

// ---------------- Enfermeros (REST) ----------------

export interface DatosPerfil {
  matricula: string
  telefono?: string
  bio?: string
  zonaIds: string[]
  practicaIds: string[]
}

export const enfermerosApi = {
  buscar: (filtro: {
    zonaId?: string
    practicaId?: string
    q?: string
    verificado?: boolean
  }) => api<Enfermero[]>('/enfermeros', { query: filtro }),
  miPerfil: () => api<Enfermero>('/enfermeros/mi-perfil'),
  guardarPerfil: (datos: DatosPerfil) =>
    api<Enfermero>('/enfermeros/mi-perfil', { method: 'PUT', body: datos }),
  verificar: (id: string, verificado: boolean) =>
    api<Enfermero>(`/enfermeros/${id}/verificacion`, {
      method: 'PATCH',
      body: { verificado },
    }),
  resenas: (id: string) => api<Resena[]>(`/enfermeros/${id}/resenas`),
}

// ---------------- Prácticas (CRUD GraphQL) ----------------

const CAMPOS_PRACTICA = 'id nombre descripcion duracionEstimadaMin activa'

export interface DatosPractica {
  nombre: string
  descripcion?: string
  duracionEstimadaMin: number
  activa?: boolean
}

export const practicasApi = {
  listar: async (soloActivas = false) =>
    (
      await gql<{ practicas: Practica[] }>(
        `query ($soloActivas: Boolean) { practicas(soloActivas: $soloActivas) { ${CAMPOS_PRACTICA} } }`,
        { soloActivas },
      )
    ).practicas,
  crear: async (input: DatosPractica) =>
    (
      await gql<{ crearPractica: Practica }>(
        `mutation ($input: CrearPracticaInput!) { crearPractica(input: $input) { ${CAMPOS_PRACTICA} } }`,
        { input },
      )
    ).crearPractica,
  actualizar: async (id: string, input: Partial<DatosPractica>) =>
    (
      await gql<{ actualizarPractica: Practica }>(
        `mutation ($id: ID!, $input: ActualizarPracticaInput!) { actualizarPractica(id: $id, input: $input) { ${CAMPOS_PRACTICA} } }`,
        { id, input },
      )
    ).actualizarPractica,
  eliminar: async (id: string) =>
    (
      await gql<{ eliminarPractica: Practica }>(
        `mutation ($id: ID!) { eliminarPractica(id: $id) { id } }`,
        { id },
      )
    ).eliminarPractica,
}

// ---------------- Solicitudes (CRUD GraphQL + flujo REST) ----------------

const CAMPOS_SOLICITUD = `
  id pacienteId pacienteNombre origen centroOrigen direccion fechaInicio fechaFin
  frecuencia observaciones estado motivoCancelacion createdAt
  zona { id nombre departamento }
  practicas { id nombre duracionEstimadaMin }
  enfermero { id nombre apellido matricula telefono puntajePromedio }
`

export interface DatosSolicitud {
  pacienteId?: string
  centroOrigen?: string
  zonaId: string
  practicaIds: string[]
  direccion: string
  fechaInicio: string
  fechaFin: string
  frecuencia: string
  observaciones?: string
}

export interface FiltroSolicitudes {
  estado?: EstadoSolicitud
  zonaId?: string
  vista?: 'disponibles' | 'asignadas'
}

export const solicitudesApi = {
  listar: async (filtro: FiltroSolicitudes = {}) =>
    (
      await gql<{ solicitudes: Solicitud[] }>(
        `query ($filtro: FiltroSolicitudesInput) { solicitudes(filtro: $filtro) { ${CAMPOS_SOLICITUD} } }`,
        { filtro },
      )
    ).solicitudes,
  crear: async (input: DatosSolicitud) =>
    (
      await gql<{ crearSolicitud: Solicitud }>(
        `mutation ($input: CrearSolicitudInput!) { crearSolicitud(input: $input) { ${CAMPOS_SOLICITUD} } }`,
        { input },
      )
    ).crearSolicitud,
  actualizar: async (id: string, input: Partial<DatosSolicitud>) =>
    (
      await gql<{ actualizarSolicitud: Solicitud }>(
        `mutation ($id: ID!, $input: ActualizarSolicitudInput!) { actualizarSolicitud(id: $id, input: $input) { ${CAMPOS_SOLICITUD} } }`,
        { id, input },
      )
    ).actualizarSolicitud,
  eliminar: async (id: string) =>
    (
      await gql<{ eliminarSolicitud: { id: string } }>(
        `mutation ($id: ID!) { eliminarSolicitud(id: $id) { id } }`,
        { id },
      )
    ).eliminarSolicitud,

  aceptar: (id: string) =>
    api<Solicitud>(`/solicitudes/${id}/aceptar`, { method: 'POST' }),
  cancelar: (id: string, motivo?: string) =>
    api<Solicitud>(`/solicitudes/${id}/cancelar`, {
      method: 'POST',
      body: { motivo },
    }),
  finalizar: (id: string) =>
    api<Solicitud>(`/solicitudes/${id}/finalizar`, { method: 'POST' }),
  visitas: (id: string) => api<Visita[]>(`/solicitudes/${id}/visitas`),
  registrarVisita: (
    id: string,
    datos: {
      observaciones: string
      practicaIds?: string[]
      presionArterial?: string
      temperatura?: number
    },
  ) => api<Visita>(`/solicitudes/${id}/visitas`, { method: 'POST', body: datos }),
  calificar: (id: string, puntaje: number, comentario?: string) =>
    api<Resena>(`/solicitudes/${id}/resena`, {
      method: 'POST',
      body: { puntaje, comentario },
    }),
}

// ---------------- Estadísticas (REST) ----------------

export const estadisticasApi = {
  cobertura: () => api<CoberturaZona[]>('/estadisticas/cobertura'),
}
