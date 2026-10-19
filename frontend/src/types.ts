export type Rol = 'ADMIN' | 'ENFERMERO' | 'PACIENTE'

export type EstadoSolicitud =
  | 'PENDIENTE'
  | 'ACEPTADA'
  | 'EN_CURSO'
  | 'FINALIZADA'
  | 'CANCELADA'

export type OrigenSolicitud = 'DERIVACION' | 'PARTICULAR'

export interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  rol: Rol
  activo: boolean
}

export interface Zona {
  id: string
  nombre: string
  departamento: string
}

export interface Practica {
  id: string
  nombre: string
  descripcion?: string
  duracionEstimadaMin: number
  activa: boolean
}

export interface Enfermero {
  id: string
  usuarioId: string
  nombre: string
  apellido: string
  matricula: string
  telefono?: string
  bio?: string
  zonas: Zona[]
  practicas: Practica[]
  verificado: boolean
  puntajePromedio: number
  cantidadResenas: number
}

export interface Solicitud {
  id: string
  pacienteId: string
  pacienteNombre: string
  origen: OrigenSolicitud
  centroOrigen?: string | null
  zona: Zona
  practicas: Pick<Practica, 'id' | 'nombre' | 'duracionEstimadaMin'>[]
  direccion: string
  fechaInicio: string
  fechaFin: string
  frecuencia: string
  observaciones?: string | null
  estado: EstadoSolicitud
  enfermero?: Pick<
    Enfermero,
    'id' | 'nombre' | 'apellido' | 'matricula' | 'telefono' | 'puntajePromedio'
  > | null
  motivoCancelacion?: string | null
  createdAt: string
}

export interface Visita {
  id: string
  fecha: string
  practicasRealizadas: { id: string; nombre: string }[]
  observaciones: string
  presionArterial?: string
  temperatura?: number
  enfermero: { nombre: string; apellido: string; matricula: string }
}

export interface Resena {
  id: string
  pacienteNombre: string
  puntaje: number
  comentario?: string
  createdAt: string
}

export type NivelCobertura = 'SIN_DEMANDA' | 'ADECUADA' | 'BAJA' | 'CRITICA'

export interface CoberturaZona {
  zonaId: string
  zona: string
  departamento: string
  enfermerosVerificados: number
  pendientes: number
  activas: number
  finalizadas: number
  cargaPorEnfermero: number | null
  nivel: NivelCobertura
}
