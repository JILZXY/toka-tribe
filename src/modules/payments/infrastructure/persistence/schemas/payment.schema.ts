import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus } from '../../../../../shared/domain/enums/payment-status.enum.js';

@Schema({ timestamps: true, collection: 'payments' })
export class PaymentDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  externalPaymentId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ default: PaymentStatus.PENDING, enum: Object.values(PaymentStatus) })
  status: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;
}

export const PaymentSchema = SchemaFactory.createForClass(PaymentDocument);
// CRÍTICO: Idempotencia — mismo external payment no se procesa dos veces
PaymentSchema.index({ externalPaymentId: 1 }, { unique: true });
// Consulta de pagos por usuario y estado (panel del usuario)
PaymentSchema.index({ userId: 1, status: 1 });
// Historial de pagos del usuario paginado por fecha (covered query)
PaymentSchema.index({ userId: 1, createdAt: -1 });
