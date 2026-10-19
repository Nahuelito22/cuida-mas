import { INestApplication, INestMicroservice } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { Rol } from '@app/common';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { AuthServiceModule } from '../../auth-service/src/auth-service.module';
import { UsuariosService } from '../../auth-service/src/usuarios/usuarios.service';
import { CuidadosServiceModule } from '../../cuidados-service/src/cuidados-service.module';

/**
 * Levanta el sistema completo como en producción, pero en memoria:
 * MongoDB → auth-service y cuidados-service (TCP) → api-gateway (HTTP).
 */
export async function levantarSistema() {
  const mongo = await MongoMemoryServer.create();
  const authPort = 4101 + Math.floor(Math.random() * 400);
  const cuidadosPort = authPort + 500;

  Object.assign(process.env, {
    JWT_SECRET: 'secreto-de-prueba-e2e',
    AUTH_MONGO_URI: mongo.getUri('cuidamas_auth_e2e'),
    CUIDADOS_MONGO_URI: mongo.getUri('cuidamas_cuidados_e2e'),
    AUTH_HOST: '127.0.0.1',
    AUTH_PORT: String(authPort),
    CUIDADOS_HOST: '127.0.0.1',
    CUIDADOS_PORT: String(cuidadosPort),
  });

  const microservicio = async (modulo: unknown, port: number) => {
    const ms = await NestFactory.createMicroservice<MicroserviceOptions>(
      modulo,
      {
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port },
        logger: false,
      },
    );
    await ms.listen();
    return ms;
  };
  const authService: INestMicroservice = await microservicio(
    AuthServiceModule,
    authPort,
  );
  const cuidadosService: INestMicroservice = await microservicio(
    CuidadosServiceModule,
    cuidadosPort,
  );

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const gateway: INestApplication<App> = moduleRef.createNestApplication({
    logger: false,
  });
  configurarApp(gateway);
  await gateway.init();

  const http = () => request(gateway.getHttpServer());

  return {
    http,

    /** Ejecuta una operación GraphQL y devuelve { data, errors }. */
    graphql: async (
      query: string,
      variables: Record<string, unknown> = {},
      token?: string,
    ) => {
      const req = http().post('/graphql').send({ query, variables });
      if (token) req.set('Authorization', `Bearer ${token}`);
      const res = await req;
      return res.body as {
        data: Record<string, any> | null;
        errors?: { message: string; extensions: { status?: number } }[];
      };
    },

    /** Los ADMIN no se registran por la API: se crean directo en auth-service (como el seed). */
    crearAdmin: async (email: string, password: string) => {
      await authService.get(UsuariosService).crear({
        email,
        password,
        nombre: 'Centro',
        apellido: 'de Salud',
        dni: '10000001',
        rol: Rol.ADMIN,
      });
    },

    login: async (email: string, password: string): Promise<string> => {
      const res = await http()
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      return (res.body as { accessToken: string }).accessToken;
    },

    cerrar: async () => {
      await gateway.close();
      await authService.close();
      await cuidadosService.close();
      await mongo.stop();
    },
  };
}

export type Sistema = Awaited<ReturnType<typeof levantarSistema>>;
