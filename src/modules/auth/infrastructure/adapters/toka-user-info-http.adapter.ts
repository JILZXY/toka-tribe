import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  TokaUserInfoPort,
  TokaUserInfo,
} from '../../application/ports/toka-user-info.port.js';

/**
 * Adapter HTTP para obtener información de usuario de Toka.
 * Llama a GET /v1/user/info con Authorization: Bearer <accessToken>.
 * OWASP A02: accessToken nunca se loggea ni se devuelve al cliente.
 */
@Injectable()
export class TokaUserInfoHttpAdapter implements TokaUserInfoPort {
  private readonly logger = new Logger(TokaUserInfoHttpAdapter.name);
  private readonly baseUrl: string;
  private readonly appId: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('toka.baseUrl');
    this.appId = this.configService.getOrThrow<string>('toka.appId');
  }

  async getUserInfo(accessToken: string): Promise<TokaUserInfo> {
    const url = `${this.baseUrl}/v1/user/info`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-App-Id': this.appId,
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Toka user/info respondió con status ${response.status}`,
        );
        return { userId: '' };
      }

      const data = (await response.json()) as {
        success: boolean;
        data: TokaUserInfo;
      };

      if (!data.success || !data.data) {
        return { userId: '' };
      }

      return data.data;
    } catch {
      this.logger.warn('No se pudo obtener info de usuario de Toka');
      return { userId: '' };
    }
  }
}
