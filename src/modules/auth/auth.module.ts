import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './presentation/controllers/auth.controller.js';
import { LoginWithTokaUseCase } from './application/use-cases/login-with-toka.use-case.js';
import { SyncTokaProfileUseCase } from './application/use-cases/sync-toka-profile.use-case.js';
import { TOKA_AUTH_PORT } from './application/ports/toka-auth.port.js';
import { TOKA_USER_INFO_PORT } from './application/ports/toka-user-info.port.js';
import { TokaAuthHttpAdapter } from './infrastructure/adapters/toka-auth-http.adapter.js';
import { TokaUserInfoHttpAdapter } from './infrastructure/adapters/toka-user-info-http.adapter.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: config.get<number>('auth.jwtExpiresIn') ?? 3600,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Use Cases
    LoginWithTokaUseCase,
    SyncTokaProfileUseCase,

    // Adapters (inyectados por puerto)
    {
      provide: TOKA_AUTH_PORT,
      useClass: TokaAuthHttpAdapter,
    },
    {
      provide: TOKA_USER_INFO_PORT,
      useClass: TokaUserInfoHttpAdapter,
    },

    // Auth infrastructure
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, JwtStrategy, PassportModule],
})
export class AuthModule {}
