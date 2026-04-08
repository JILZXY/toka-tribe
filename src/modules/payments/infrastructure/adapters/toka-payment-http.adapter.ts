import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TokaPaymentPort } from '../../application/ports/toka-payment.port.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

@Injectable()
export class TokaPaymentHttpAdapter implements TokaPaymentPort {
  private readonly logger = new Logger(TokaPaymentHttpAdapter.name);
  private readonly baseUrl: string;
  private readonly appId: string;
  private readonly merchantCode: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('toka.baseUrl');
    this.appId = this.configService.getOrThrow<string>('toka.appId');
    this.merchantCode = this.configService.getOrThrow<string>('toka.merchantCode');
  }

  async createPayment(
    tokaUserId: string,
    orderTitle: string,
    amount: number,
    currency: string,
    accessToken: string,
  ): Promise<{ paymentId: string; paymentUrl: string }> {
    const url = `${this.baseUrl}/v1/payment/create`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-App-Id': this.appId,
          'Alipay-MerchantCode': this.merchantCode,
        },
        body: JSON.stringify({
          userId: tokaUserId,
          orderTitle,
          orderAmount: {
            value: amount.toString(),
            currency,
          },
        }),
      });

      if (!response.ok) {
        throw new AppException(
          ErrorCodes.PAYMENT_FAILED,
          'El proveedor de pagos rechazó la creación de la orden.',
        );
      }

      const rawData = await response.json();
      const payload = rawData as { success: boolean; data: { paymentId: string; paymentUrl: string } };

      if (!payload.success || !payload.data) {
        throw new AppException(
          ErrorCodes.PAYMENT_FAILED,
          'La respuesta de creación de pago fue fallida o estropeada.',
        );
      }

      return payload.data;
    } catch (e) {
      if (e instanceof AppException) throw e;
      this.logger.error('Fallo de red al solicitar pago a Toka', e);
      throw new AppException(ErrorCodes.INTERNAL_ERROR, 'Error de infraestructura de pagos.');
    }
  }

  async inquiryPayment(
    paymentId: string,
    accessToken: string,
  ): Promise<{ status: string; resultCode: string }> {
    const url = `${this.baseUrl}/v1/payment/inquiry`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-App-Id': this.appId,
        },
        body: JSON.stringify({ paymentId }),
      });

      if (!response.ok) {
        return { status: 'UNKNOWN', resultCode: '' };
      }

      const payload = (await response.json()) as {
        success: boolean;
        data?: { paymentStatus: string; paymentResultCode: string };
      };

      if (!payload.success || !payload.data) {
        return { status: 'UNKNOWN', resultCode: '' };
      }

      return {
        status: payload.data.paymentStatus,
        resultCode: payload.data.paymentResultCode,
      };
    } catch {
      this.logger.error('No se pudo verificar el pago en Toka');
      return { status: 'UNKNOWN', resultCode: '' };
    }
  }
}
