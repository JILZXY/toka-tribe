import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

/**
 * Guard JWT que protege rutas autenticadas.
 * OWASP A01: Broken Access Control — toda ruta protegida pasa por aquí.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw AppException.unauthorized(
        ErrorCodes.AUTH_UNAUTHORIZED,
        'No autorizado. Inicie sesión nuevamente.',
      );
    }
    return user;
  }
}
