import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { PaymentDocument } from '../../infrastructure/persistence/schemas/payment.schema.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';
import { PaymentStatus } from '../../../../shared/domain/enums/payment-status.enum.js';

@ApiTags('payments')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    @InjectModel(PaymentDocument.name) private readonly paymentModel: Model<PaymentDocument>,
    private readonly userRepo: UserRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar pago (idempotente)' })
  @ApiResponse({ status: 201, description: 'Pago registrado.' })
  @ApiResponse({ status: 409, description: 'Este pago ya fue registrado.' })
  async register(
    @CurrentUser() user: { userId: string },
    @Body() body: {
      externalPaymentId: string;
      amount: number;
      currency: string;
      description: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);

    try {
      const payment = await this.paymentModel.create({
        userId: dbUser._id,
        externalPaymentId: body.externalPaymentId,
        amount: body.amount,
        currency: body.currency,
        description: body.description,
        metadata: body.metadata,
      });

      this.logger.log(`Pago registrado: ${payment._id} para usuario ${user.userId}`);
      return { paymentId: payment._id, status: payment.status };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
        // Idempotencia: devolver el pago existente
        const existing = await this.paymentModel.findOne({ externalPaymentId: body.externalPaymentId }).exec();
        if (existing) {
          return { paymentId: existing._id, status: existing.status, alreadyProcessed: true };
        }
        throw AppException.conflict(ErrorCodes.PAYMENT_DUPLICATE, 'Este pago ya fue registrado.');
      }
      throw error;
    }
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirmar pago y activar membresía' })
  async confirm(@Body() body: { externalPaymentId: string }) {
    const payment = await this.paymentModel.findOne({ externalPaymentId: body.externalPaymentId }).exec();
    if (!payment) {
      throw AppException.notFound(ErrorCodes.PAYMENT_NOT_FOUND, 'Pago no encontrado.');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { confirmed: true, alreadyProcessed: true };
    }

    payment.status = PaymentStatus.COMPLETED;
    await payment.save();

    // Upgrade membership
    await this.userRepo.updateProfile(
      (await this.userRepo.findByIdOrThrow((payment.userId as Types.ObjectId).toString())).tokaUserId,
      {},
    );

    return { confirmed: true, paymentId: payment._id };
  }

  @Get('me')
  @ApiOperation({ summary: 'Mis pagos' })
  async myPayments(@CurrentUser() user: { userId: string }) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    return this.paymentModel.find({ userId: dbUser._id }).sort({ createdAt: -1 }).exec();
  }
}
