import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/**
 * Configuración HTTP del gateway. Está separada de main.ts para que los tests
 * e2e levanten la aplicación exactamente igual que en producción.
 */
export function configurarApp(app: INestApplication): void {
  app.use(
    helmet({
      // La CSP la aplica el frontend (nginx). Acá se desactiva para que funcionen
      // las herramientas de desarrollo: Swagger UI y el explorador de GraphQL.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const origenes = (
    process.env.CORS_ORIGIN ?? 'http://localhost:5180,http://localhost:5173'
  ).split(',');
  app.enableCors({ origin: origenes });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que no están en el DTO
      forbidNonWhitelisted: true, // y rechaza la petición si los mandan
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Cuidá+ API')
    .setDescription(
      'Red de enfermería domiciliaria con continuidad post-alta. ' +
        'REST para autenticación y flujo de solicitudes; el CRUD de Prácticas y ' +
        'Solicitudes está en GraphQL (/graphql).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
}
