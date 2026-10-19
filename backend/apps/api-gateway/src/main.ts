import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);

  const port = Number(process.env.GATEWAY_PORT ?? 3000);
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`api-gateway en http://localhost:${port}`);
  logger.log(`Swagger:  http://localhost:${port}/api/docs`);
  logger.log(`GraphQL:  http://localhost:${port}/graphql`);
}
void bootstrap();
