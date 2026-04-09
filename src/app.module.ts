import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import {
  appConfig,
  dbConfig,
  authConfig,
  tokaConfig,
  redisConfig,
  envValidationSchema,
} from './config/env/index.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PetsModule } from './modules/pets/pets.module.js';
import { SeasonsModule } from './modules/seasons/seasons.module.js';
import { TribesModule } from './modules/tribes/tribes.module.js';
import { GamesModule } from './modules/games/games.module.js';
import { ChallengesModule } from './modules/challenges/challenges.module.js';
import { ScoringModule } from './modules/scoring/scoring.module.js';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module.js';
import { RewardsModule } from './modules/rewards/rewards.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { TraceIdMiddleware } from './shared/presentation/middleware/trace-id.middleware.js';

@Module({
  imports: [
    // ── Configuración con validación estricta ──
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, authConfig, tokaConfig, redisConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),

    // ── Cache Global: Redis si está disponible, si no usar cache en memoria del proceso
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('redis.url');
        const ttlMs = (config.get<number>('redis.ttl') as number) * 1000;

        if (redisUrl) {
          // Usar Redis Store (compartido entre procesos/instancias)
          return {
            store: await redisStore({ url: redisUrl, ttl: ttlMs }),
          };
        }

        // Fallback: cache en memoria del proceso (no compartida entre instancias)
        return {
          ttl: ttlMs,
        };
      },
    }),

    // ── MongoDB ──
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('db.uri'),
      }),
    }),

    // ── Rate Limiting (OWASP A04 - Insecure Design) ──
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // ── Módulos de la aplicación ──
    HealthModule,
    AuthModule,
    UsersModule,
    PetsModule,
    SeasonsModule,
    TribesModule,
    GamesModule,
    ChallengesModule,
    ScoringModule,
    LeaderboardModule,
    RewardsModule,
    PaymentsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // TraceId en todas las rutas para correlación de logs
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
