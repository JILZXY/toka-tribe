import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configura Swagger/OpenAPI para documentación automática de la API.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Toka Tribe API')
    .setDescription(
      'API de gamificación para Toka Tribe: mascotas, tribus, ligas, temporadas y recompensas.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT interno de la aplicación.',
      },
      'jwt',
    )
    .addTag('health', 'Endpoints de monitoreo y healthcheck')
    .addTag('auth', 'Autenticación y sesiones')
    .addTag('users', 'Gestión de usuarios')
    .addTag('pets', 'Mascotas y equipamiento')
    .addTag('tribes', 'Tribus y membresías')
    .addTag('seasons', 'Temporadas')
    .addTag('games', 'Juegos')
    .addTag('challenges', 'Retos')
    .addTag('scoring', 'Sesiones de juego y puntuación')
    .addTag('leaderboard', 'Clasificaciones y snapshots')
    .addTag('rewards', 'Recompensas y reclamos')
    .addTag('payments', 'Pagos con Toka')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
