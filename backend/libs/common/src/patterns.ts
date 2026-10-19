/**
 * Patrones de mensajes TCP entre el api-gateway y los microservicios.
 * Están centralizados acá para que emisor y receptor usen exactamente el mismo nombre.
 */

export const AUTH_SERVICE = 'AUTH_SERVICE';
export const CUIDADOS_SERVICE = 'CUIDADOS_SERVICE';

export const AUTH_PATTERNS = {
  REGISTRAR: 'auth.registrar',
  LOGIN: 'auth.login',
  PERFIL: 'auth.perfil',
  BUSCAR_USUARIOS: 'usuarios.buscar',
} as const;

export const CUIDADOS_PATTERNS = {
  // Catálogo de prácticas (CRUD GraphQL)
  PRACTICA_CREAR: 'practicas.crear',
  PRACTICA_LISTAR: 'practicas.listar',
  PRACTICA_OBTENER: 'practicas.obtener',
  PRACTICA_ACTUALIZAR: 'practicas.actualizar',
  PRACTICA_ELIMINAR: 'practicas.eliminar',

  // Zonas
  ZONA_CREAR: 'zonas.crear',
  ZONA_LISTAR: 'zonas.listar',

  // Enfermeros
  ENFERMERO_GUARDAR_PERFIL: 'enfermeros.guardarPerfil',
  ENFERMERO_MI_PERFIL: 'enfermeros.miPerfil',
  ENFERMERO_OBTENER: 'enfermeros.obtener',
  ENFERMERO_BUSCAR: 'enfermeros.buscar',
  ENFERMERO_VERIFICAR: 'enfermeros.verificar',

  // Solicitudes (CRUD GraphQL + acciones del flujo por REST)
  SOLICITUD_CREAR: 'solicitudes.crear',
  SOLICITUD_LISTAR: 'solicitudes.listar',
  SOLICITUD_OBTENER: 'solicitudes.obtener',
  SOLICITUD_ACTUALIZAR: 'solicitudes.actualizar',
  SOLICITUD_ELIMINAR: 'solicitudes.eliminar',
  SOLICITUD_ACEPTAR: 'solicitudes.aceptar',
  SOLICITUD_CANCELAR: 'solicitudes.cancelar',
  SOLICITUD_FINALIZAR: 'solicitudes.finalizar',

  // Bitácora y reseñas
  VISITA_REGISTRAR: 'visitas.registrar',
  VISITA_LISTAR: 'visitas.listar',
  RESENA_CREAR: 'resenas.crear',
  RESENA_LISTAR_POR_ENFERMERO: 'resenas.listarPorEnfermero',

  // Estadísticas
  COBERTURA_POR_ZONA: 'estadisticas.coberturaPorZona',
} as const;
