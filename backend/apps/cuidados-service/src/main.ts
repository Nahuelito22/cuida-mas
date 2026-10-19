import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CuidadosServiceModule } from './cuidados-service.module';

async function bootstrap() {
  const port = Number(process.env.CUIDADOS_PORT ?? 4002);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CuidadosServiceModule,
    { transport: Transport.TCP, options: { host: '0.0.0.0', port } },
  );
  await app.listen();
  Logger.log(
    `cuidados-service escuchando por TCP en el puerto ${port}`,
    'Bootstrap',
  );
}
void bootstrap();
