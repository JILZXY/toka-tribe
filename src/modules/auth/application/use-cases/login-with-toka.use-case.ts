import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TOKA_AUTH_PORT, type TokaAuthPort } from '../ports/toka-auth.port.js';
import { TOKA_USER_INFO_PORT, type TokaUserInfoPort, type TokaUserInfo } from '../ports/toka-user-info.port.js';
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
    @Inject(TOKA_USER_INFO_PORT)
    private readonly tokaUserInfo: TokaUserInfoPort,
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

    // 2. Obtener info del usuario de Toka
    let userInfo: TokaUserInfo;
    try {
      userInfo = await this.tokaUserInfo.getUserInfo(tokaResult.accessToken);
    } catch {
      this.logger.warn('Fallo al obtener perfil de Toka');
      userInfo = { userId: tokaResult.userId };
    }

    // 3. Generar JWT interno (nunca devolver token de Toka al cliente)
    const jwtPayload = {
      sub: tokaResult.userId,
      type: 'access' as const,
    };

    const expiresIn = this.configService.get<number>('auth.jwtExpiresIn') ?? 3600;
    const refreshExpiresIn = this.configService.get<number>('auth.jwtRefreshExpiresIn') ?? 604800;

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('auth.jwtSecret'),
      expiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sub: tokaResult.userId, type: 'refresh' as const },
      {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        expiresIn: refreshExpiresIn,
      },
    );

    this.logger.log(`Usuario autenticado exitosamente: ${tokaResult.userId}`);

    return {
      accessToken,
      refreshToken,
      user: {
        tokaUserId: tokaResult.userId,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
      },
    };
  }
}
