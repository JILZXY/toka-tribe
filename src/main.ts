import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AppConstants } from './config/constants/app.constants.js';
import { GlobalExceptionFilter } from './shared/presentation/filters/global-exception.filter.js';
import { ResponseInterceptor } from './shared/presentation/interceptors/response.interceptor.js';
import { setupSwagger } from './config/swagger/swagger.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // ── Prefijo global de la API ──
  app.setGlobalPrefix(AppConstants.API_PREFIX);

  // ── Seguridad HTTP (OWASP A05) ──
  app.use(helmet());

  // ── CORS (configurar según dominios permitidos en producción) ──
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '*'
      ? process.env.ALLOWED_ORIGINS.split(',')
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
    credentials: true,
  });

  // ── Validación global de DTOs (OWASP A03 - Injection, A08 - Integrity) ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Remueve propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Rechaza propiedades no declaradas
      transform: true,            // Transforma payloads a instancias de DTO
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );

  // ── Filtro de excepciones global ──
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Interceptor de respuesta estándar ──
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Swagger (solo en desarrollo) ──
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
    Logger.log('📄 Swagger disponible en /docs', 'Bootstrap');
  }

  const port = process.env.PORT as string;
  await app.listen(port);
  Logger.log(`🚀 Toka Tribe API escuchando en puerto ${port}`, 'Bootstrap');
  Logger.log(`📍 Prefijo: /${AppConstants.API_PREFIX}`, 'Bootstrap');
}

bootstrap();
