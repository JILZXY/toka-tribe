import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentDocument, PaymentSchema } from './infrastructure/persistence/schemas/payment.schema.js';
import { PaymentsController } from './presentation/controllers/payments.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentDocument.name, schema: PaymentSchema }]),
    AuthModule,
    UsersModule,
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
