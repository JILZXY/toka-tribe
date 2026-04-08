import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

export interface JwtPayload {
  sub: string; // tokaUserId
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

/**
 * Estrategia JWT para autenticación de rutas protegidas.
 * OWASP A07: Valida expiración y tipo de token.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.getOrThrow<string>('auth.jwtSecret');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): { userId: string } {
    if (payload.type !== 'access') {
      throw AppException.unauthorized(
        ErrorCodes.AUTH_INVALID_TOKEN,
        'Tipo de token inválido.',
      );
    }

    if (!payload.sub) {
      throw AppException.unauthorized(
        ErrorCodes.AUTH_INVALID_TOKEN,
        'Token sin identificador de usuario.',
      );
    }

    return { userId: payload.sub };
  }
}
