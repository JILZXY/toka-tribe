import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Division } from '../../../../../shared/domain/enums/division.enum.js';
import { TribeStatus } from '../../../../../shared/domain/enums/tribe-status.enum.js';

@Schema({ timestamps: true, collection: 'tribes' })
export class TribeDocument extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  badgeUrl: string;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true })
  leaderId: Types.ObjectId;

  @Prop({ default: Division.BRONCE, enum: Object.values(Division) })
  division: string;

  @Prop({ type: Number, default: 0, validate: { validator: Number.isInteger, message: 'seasonPoints debe ser entero' } })
  seasonPoints: number;

  @Prop({ type: Number, default: 0, validate: { validator: Number.isInteger, message: 'totalPoints debe ser entero' } })
  totalPoints: number;

  @Prop({ default: 1, min: 0, max: 10 })
  memberCount: number;

  @Prop({ default: TribeStatus.ACTIVE, enum: Object.values(TribeStatus) })
  status: string;
}

export const TribeSchema = SchemaFactory.createForClass(TribeDocument);
TribeSchema.index({ division: 1, seasonPoints: -1 });
TribeSchema.index({ slug: 1 }, { unique: true });
TribeSchema.index({ leaderId: 1 });
TribeSchema.index({ name: 'text' });
TribeSchema.index({ status: 1, isPublic: 1, memberCount: 1 });
