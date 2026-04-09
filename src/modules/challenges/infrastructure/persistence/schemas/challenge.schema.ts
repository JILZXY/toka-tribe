import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChallengeStatus } from '../../../../../shared/domain/enums/challenge-status.enum.js';

@Schema({ timestamps: true, collection: 'challenges' })
export class ChallengeDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'SeasonDocument', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GameDocument', required: true })
  gameId: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ default: ChallengeStatus.UPCOMING, enum: Object.values(ChallengeStatus) })
  status: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: Number, default: 1000, validate: { validator: Number.isInteger, message: 'maxPointsPerUser debe ser entero' } })
  maxPointsPerUser: number;
}

export const ChallengeSchema = SchemaFactory.createForClass(ChallengeDocument);
ChallengeSchema.index({ seasonId: 1, status: 1 });
ChallengeSchema.index({ endDate: 1, status: 1 });
