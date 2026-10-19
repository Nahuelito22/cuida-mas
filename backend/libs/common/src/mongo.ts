import { Error as MongooseError, SchemaOptions } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { RpcErrors } from './rpc-errors';

/**
 * Opciones comunes a todos los esquemas: fechas automáticas y una salida JSON
 * prolija (`id` en lugar de `_id`, sin `__v`).
 */
export function opcionesEsquema(coleccion: string): SchemaOptions {
  return {
    collection: coleccion,
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  };
}

/** Lanza 400 si el id no tiene formato de ObjectId (evita CastError de Mongo). */
export function validarObjectId(id: string, entidad = 'recurso'): void {
  if (!isValidObjectId(id)) {
    throw RpcErrors.badRequest(`El id de ${entidad} no es válido`);
  }
}

/** Convierte un error de validación de Mongoose en un 400 legible. */
export function convertirErrorValidacion(error: unknown): never {
  if (error instanceof MongooseError.ValidationError) {
    const mensajes = Object.values(error.errors).map((e) => e.message);
    throw RpcErrors.badRequest(mensajes.join('. '));
  }
  throw error;
}

/** Escapa caracteres especiales para usar texto del usuario dentro de una RegExp. */
export function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
