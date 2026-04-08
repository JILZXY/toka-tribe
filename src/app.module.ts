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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // TraceId en todas las rutas para correlación de logs
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
