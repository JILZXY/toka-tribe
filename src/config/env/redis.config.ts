import { registerAs } from '@nestjs/config';

/**
 * Configuración de Redis para cache global.
 * Todas las variables se leen desde el entorno para evitar hardcodeos (OWASP A05).
 */
export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  ttl: parseInt(process.env.CACHE_TTL_SECONDS ?? '30', 10),
  leaderboardTtl: parseInt(process.env.LEADERBOARD_CACHE_TTL_SECONDS ?? '20', 10),
}));
