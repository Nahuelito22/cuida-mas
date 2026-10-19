import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import { Rol, UsuarioActual } from '@app/common';
import { EnfermerosModule } from '../src/enfermeros/enfermeros.module';
import { EstadisticasModule } from '../src/estadisticas/estadisticas.module';
import { PracticasModule } from '../src/practicas/practicas.module';
import { SolicitudesModule } from '../src/solicitudes/solicitudes.module';
import { ZonasModule } from '../src/zonas/zonas.module';

/** Levanta los módulos de cuidados-service contra una MongoDB en memoria. */
export async function crearModuloDePrueba() {
  const mongo = await MongoMemoryServer.create();
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongo.getUri()),
      PracticasModule,
      ZonasModule,
      EnfermerosModule,
      SolicitudesModule,
      EstadisticasModule,
    ],
  }).compile();
  const connection = moduleRef.get<Connection>(getConnectionToken());
  await connection.syncIndexes();

  return {
    moduleRef,
    limpiar: async () => {
      const colecciones = Object.values(connection.collections);
      await Promise.all(colecciones.map((c) => c.deleteMany({})));
    },
    cerrar: async () => {
      await moduleRef.close();
      await mongo.stop();
    },
  };
}

export function usuario(
  rol: Rol,
  id: string,
  nombre = 'Ana',
  apellido = 'Pérez',
): UsuarioActual {
  return { id, rol, nombre, apellido };
}

/** Ejecuta la promesa y devuelve el cuerpo del RpcException que lanzó. */
export async function errorDe(promesa: Promise<unknown>) {
  try {
    await promesa;
  } catch (error) {
    if (!(error instanceof RpcException)) throw error;
    return error.getError() as { statusCode: number; message: string };
  }
  throw new Error('Se esperaba un error y no ocurrió');
}
