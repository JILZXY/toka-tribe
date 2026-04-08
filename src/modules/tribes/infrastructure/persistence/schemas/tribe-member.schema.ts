import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TribeRole } from '../../../../../shared/domain/enums/tribe-role.enum.js';
import { Tier } from '../../../../../shared/domain/enums/tier.enum.js';

@Schema({ timestamps: { createdAt: 'joinedAt', updatedAt: false }, collection: 'tribe_members' })
export class TribeMemberDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'TribeDocument', required: true })
  tribeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SeasonDocument', required: true })
  seasonId: Types.ObjectId;

  @Prop({ default: TribeRole.MEMBER, enum: Object.values(TribeRole) })
  role: string;

  @Prop({ type: Number, default: 0, validate: { validator: Number.isInteger, message: 'pointsContributed debe ser entero' } })
  pointsContributed: number;

  @Prop({ default: Tier.NONE, enum: Object.values(Tier) })
  activeTier: string;

  @Prop({ default: 1.0, type: Number })
  activeMultiplier: number;

  @Prop({ type: Number, default: 0 })
  contributionProportion: number;

  @Prop({ type: Number, default: 0, validate: { validator: Number.isInteger, message: 'finalSeasonPoints debe ser entero' } })
  finalSeasonPoints: number;
}

export const TribeMemberSchema = SchemaFactory.createForClass(TribeMemberDocument);
TribeMemberSchema.index({ userId: 1, seasonId: 1 }, { unique: true });
TribeMemberSchema.index({ tribeId: 1, seasonId: 1, pointsContributed: -1 });
TribeMemberSchema.index({ tribeId: 1, role: 1 });
