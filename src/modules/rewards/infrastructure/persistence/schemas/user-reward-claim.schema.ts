import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'claimedAt', updatedAt: false }, collection: 'user_reward_claims' })
export class UserRewardClaimDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LeagueRewardDocument', required: true })
  rewardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SeasonDocument', required: true })
  seasonId: Types.ObjectId;
}

export const UserRewardClaimSchema = SchemaFactory.createForClass(UserRewardClaimDocument);
// CRÍTICO: Previene reclamos duplicados de la misma recompensa en la misma temporada
UserRewardClaimSchema.index({ userId: 1, rewardId: 1, seasonId: 1 }, { unique: true });
