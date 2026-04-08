import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TOKA_AUTH_PORT, type TokaAuthPort } from '../ports/toka-auth.port.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    tokaUserId: string;
    nickname?: string;
    avatar?: string;
  };
}

/**
 * Caso de uso: Login con Toka.
 * Flujo: authCode → Toka /v1/user/authenticate → JWT interno.
 * OWASP A02: Los tokens de Toka nunca se devuelven al cliente.
 * Idempotencia: El login es naturalmente idempotente por authCode de un solo uso.
 */
@Injectable()
export class LoginWithTokaUseCase {
  private readonly logger = new Logger(LoginWithTokaUseCase.name);

  constructor(
    @Inject(TOKA_AUTH_PORT)
    private readonly tokaAuth: TokaAuthPort,
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(authCode: string): Promise<LoginResult> {
    // 1. Canjear authCode con Toka
    let tokaResult: { userId: string; accessToken: string };
    try {
      tokaResult = await this.tokaAuth.authenticate(authCode);
    } catch {
      this.logger.warn('Fallo al autenticar con Toka', {
        authCodePrefix: authCode.substring(0, 3) + '***',
      });
      throw new AppException(
        ErrorCodes.AUTH_INVALID_CODE,
        'El código de autorización es inválido o ha expirado.',
      );
    }

    // 2. Crear o actualizar usuario local
    let dbUser: import('../../../users/infrastructure/persistence/schemas/user.schema.js').UserDocument;
    try {
      dbUser = await this.userRepo.upsertByTokaUserId(tokaResult.userId, {
        tokaAccessToken: tokaResult.accessToken,
      });
    } catch {
      this.logger.error(
        `Error al hacer upsert del usuario de Toka: ${tokaResult.userId}`,
      );
      throw new AppException(
        ErrorCodes.INTERNAL_ERROR,
        'Error interno al procesar el usuario.',
      );
    }

    // 3. Generar JWT interno (nunca devolver token de Toka al cliente)
    const jwtPayload = {
      sub: tokaResult.userId,
      type: 'access' as const,
    };

    const expiresIn = this.configService.get<number>('auth.jwtExpiresIn') as number;
    const refreshExpiresIn = this.configService.get<number>('auth.jwtRefreshExpiresIn') as number;

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('auth.jwtSecret'),
      expiresIn: Number(expiresIn),
    });

    const refreshToken = this.jwtService.sign(
      { sub: tokaResult.userId, type: 'refresh' as const },
      {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        expiresIn: Number(refreshExpiresIn),
      },
    );

    this.logger.log(`Usuario autenticado exitosamente: ${tokaResult.userId}`);

    return {
      accessToken,
      refreshToken,
      user: {
        tokaUserId: tokaResult.userId,
        nickname: dbUser.username,
        avatar: dbUser.avatarUrl,
      },
    };
  }
}
