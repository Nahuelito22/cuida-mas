import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const port = Number(process.env.AUTH_PORT ?? 4001);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    { transport: Transport.TCP, options: { host: '0.0.0.0', port } },
  );
  await app.listen();
  Logger.log(
    `auth-service escuchando por TCP en el puerto ${port}`,
    'Bootstrap',
  );
}
void bootstrap();
