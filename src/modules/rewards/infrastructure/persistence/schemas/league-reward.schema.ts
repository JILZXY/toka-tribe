import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RewardType } from '../../../../../shared/domain/enums/reward-type.enum.js';
import { Division } from '../../../../../shared/domain/enums/division.enum.js';

@Schema({ timestamps: true, collection: 'league_rewards' })
export class LeagueRewardDocument extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: Object.values(RewardType) })
  rewardType: string;

  @Prop({ required: true })
  requiredPoints: number;

  @Prop({ default: Division.BRONCE, enum: Object.values(Division) })
  requiredDivision: string;

  @Prop({ default: false })
  isPremiumOnly: boolean;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;
}

export const LeagueRewardSchema = SchemaFactory.createForClass(LeagueRewardDocument);
LeagueRewardSchema.index({ requiredPoints: 1, requiredDivision: 1 });
