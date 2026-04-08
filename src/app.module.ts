import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  appConfig,
  dbConfig,
  authConfig,
  tokaConfig,
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
      load: [appConfig, dbConfig, authConfig, tokaConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
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
