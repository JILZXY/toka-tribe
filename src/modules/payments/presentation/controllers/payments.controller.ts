import { Controller, Post, Get, Body, Param, UseGuards, Logger, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { PaymentDocument } from '../../infrastructure/persistence/schemas/payment.schema.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';
import { PaymentStatus } from '../../../shared/domain/enums/payment-status.enum.js';
import { TOKA_PAYMENT_PORT, type TokaPaymentPort } from '../../application/ports/toka-payment.port.js';

@ApiTags('payments')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    @InjectModel(PaymentDocument.name) private readonly paymentModel: Model<PaymentDocument>,
    private readonly userRepo: UserRepository,
    @Inject(TOKA_PAYMENT_PORT) private readonly tokaPayment: TokaPaymentPort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear orden de pago vía Toka' })
  @ApiResponse({ status: 201, description: 'Pago creado exitosamente.' })
  @ApiResponse({ status: 401, description: 'Token de Toka no encontrado o expirado.' })
  async createOrder(
    @CurrentUser() user: { userId: string },
    @Body() body: {
      amount: number;
      currency: string;
      description: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);

    if (!dbUser.tokaAccessToken) {
      throw new AppException(
        ErrorCodes.AUTH_EXPIRED_TOKEN,
        'Se requiere inicio de sesión reciente para procesar el pago.',
      );
    }

    // Llamar a la API de Toka para crear la orden
    const tokaOrder = await this.tokaPayment.createPayment(
      dbUser.tokaUserId,
      body.description,
      body.amount,
      body.currency || 'MXN',
      dbUser.tokaAccessToken,
    );

    try {
      const payment = await this.paymentModel.create({
        userId: dbUser._id,
        externalPaymentId: tokaOrder.paymentId,
        amount: body.amount,
        currency: body.currency || 'MXN',
        description: body.description,
        metadata: body.metadata,
      });

      this.logger.log(`Pago registrado: ${payment._id} para usuario ${user.userId}`);
      return { 
        id: payment._id,
        tokaPaymentId: tokaOrder.paymentId,
        paymentUrl: tokaOrder.paymentUrl,
        status: payment.status 
      };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        // Idempotencia por externalPaymentId
        const existing = await this.paymentModel
          .findOne({ externalPaymentId: tokaOrder.paymentId })
          .exec();
        if (existing) {
          return {
            id: existing._id,
            tokaPaymentId: tokaOrder.paymentId,
            paymentUrl: tokaOrder.paymentUrl,
            status: existing.status,
            alreadyProcessed: true,
          };
        }
      }
      throw error;
    }
  }

  @Post(':id/sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sincronizar el estado del pago con Toka' })
  @ApiResponse({ status: 200, description: 'Estado sincronizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
  async syncPayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const payment = await this.paymentModel.findOne({ _id: paymentId, userId: user.userId }).exec();
    if (!payment) {
      throw new AppException(
        ErrorCodes.PAYMENT_NOT_FOUND,
        'Pago no encontrado.',
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { status: payment.status };
    }

    const dbUser = await this.userRepo.findByIdOrThrow((payment.userId as Types.ObjectId).toString());

    if (!dbUser.tokaAccessToken) {
        throw new AppException(ErrorCodes.AUTH_EXPIRED_TOKEN, 'Acceso expirado a Toka.');
    }

    const inquiry = await this.tokaPayment.inquiryPayment(payment.externalPaymentId, dbUser.tokaAccessToken);

    if (inquiry.status === 'SUCCESS' || inquiry.status === 'PAID') {
      payment.status = PaymentStatus.COMPLETED;
      await payment.save();
    } else if (inquiry.status === 'FAILED') {
      payment.status = PaymentStatus.FAILED;
      await payment.save();
    }

    return { status: payment.status };
  }

  @Get('me')
  @ApiOperation({ summary: 'Mis pagos' })
  async myPayments(@CurrentUser() user: { userId: string }) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    return this.paymentModel.find({ userId: dbUser._id }).sort({ createdAt: -1 }).exec();
  }
}
