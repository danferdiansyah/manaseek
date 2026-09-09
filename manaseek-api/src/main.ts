import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/config.service';

function setupSwagger(app: INestApplication, prefix: string): void {
  const config = new DocumentBuilder()
    .setTitle('Manaseek API')
    .setDescription(
      'Backend for the Manaseek hajj & umrah companion platform. ' +
        'This document is the shared contract between the mobile client and both backend tracks.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(AppConfigService);
  const prefix = config.get('API_PREFIX');

  // Behind the web app's rewrite the client address only survives in the
  // forwarded header; without this every request looks like it came from the
  // proxy.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix(prefix);
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.enableShutdownHooks();
  // Validation is per-route via ZodValidationPipe; no global class-validator pipe.

  if (!config.isProduction || config.get('SWAGGER_ENABLED')) {
    setupSwagger(app, prefix);
  }

  const port = config.get('PORT');
  await app.listen(port);

  Logger.log(`Manaseek API listening on http://localhost:${port}/${prefix}`, 'Bootstrap');
}

void bootstrap();
