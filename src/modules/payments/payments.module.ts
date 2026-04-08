import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentDocument, PaymentSchema } from './infrastructure/persistence/schemas/payment.schema.js';
import { PaymentsController } from './presentation/controllers/payments.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';

import { TokaPaymentHttpAdapter } from './infrastructure/adapters/toka-payment-http.adapter.js';
import { TOKA_PAYMENT_PORT } from './application/ports/toka-payment.port.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentDocument.name, schema: PaymentSchema }]),
    AuthModule,
    UsersModule,
  ],
  controllers: [PaymentsController],
  providers: [
    {
      provide: TOKA_PAYMENT_PORT,
      useClass: TokaPaymentHttpAdapter,
    },
  ],
})
export class PaymentsModule {}
