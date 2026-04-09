import { registerAs } from '@nestjs/config';

/**
 * Configuración de Redis para cache global.
 * Todas las variables se leen desde el entorno para evitar hardcodeos (OWASP A05).
 */
export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL && process.env.REDIS_URL !== '' ? process.env.REDIS_URL : undefined,
  ttl: process.env.CACHE_TTL_SECONDS ? parseInt(process.env.CACHE_TTL_SECONDS as string, 10) : 30,
  leaderboardTtl: process.env.LEADERBOARD_CACHE_TTL_SECONDS
    ? parseInt(process.env.LEADERBOARD_CACHE_TTL_SECONDS as string, 10)
    : 20,
}));
