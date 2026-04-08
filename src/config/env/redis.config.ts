import { registerAs } from '@nestjs/config';

/**
 * Configuración de Redis para cache global.
 * Todas las variables se leen desde el entorno para evitar hardcodeos (OWASP A05).
 */
export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  ttl: parseInt(process.env.CACHE_TTL_SECONDS as string, 10),
  leaderboardTtl: parseInt(process.env.LEADERBOARD_CACHE_TTL_SECONDS as string, 10),
}));
