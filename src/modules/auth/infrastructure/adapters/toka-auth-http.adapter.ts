import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  TokaAuthPort,
  TokaAuthResult,
} from '../../application/ports/toka-auth.port.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

/**
 * Adapter HTTP para autenticación con la API de Toka.
 * Canjea authCodes contra POST /v1/user/authenticate con X-App-Id.
 * OWASP A10 (SSRF): Solo se hacen requests al baseUrl configurado.
 * OWASP A02: accessToken de Toka nunca se loggea.
 */
@Injectable()
export class TokaAuthHttpAdapter implements TokaAuthPort {
  private readonly logger = new Logger(TokaAuthHttpAdapter.name);
  private readonly baseUrl: string;
  private readonly appId: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('toka.baseUrl');
    this.appId = this.configService.getOrThrow<string>('toka.appId');
  }

  async authenticate(authCode: string): Promise<TokaAuthResult> {
    const url = `${this.baseUrl}/v1/user/authenticate`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Id': this.appId,
        },
        body: JSON.stringify({ authcode: authCode }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Toka authenticate respondió con status ${response.status}`,
        );
        throw new AppException(
          ErrorCodes.AUTH_PROVIDER_UNAVAILABLE,
          'El proveedor de autenticación no está disponible en este momento.',
        );
      }

      const data = (await response.json()) as {
        success: boolean;
        data: {
          userId: string;
          accessToken: string;
          tokenType: string;
          expiresIn: number;
        };
      };

      if (!data.success || !data.data?.userId) {
        throw new AppException(
          ErrorCodes.AUTH_INVALID_CODE,
          'El código de autorización es inválido o ha expirado.',
        );
      }

      return {
        userId: data.data.userId,
        accessToken: data.data.accessToken,
        tokenType: data.data.tokenType,
        expiresIn: data.data.expiresIn,
      };
    } catch (error) {
      if (error instanceof AppException) throw error;

      this.logger.error('Error de red al comunicarse con Toka');
      throw new AppException(
        ErrorCodes.AUTH_PROVIDER_UNAVAILABLE,
        'No se pudo conectar con el proveedor de autenticación.',
      );
    }
  }
}
