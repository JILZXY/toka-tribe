import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Division } from '../../../../../shared/domain/enums/division.enum.js';
import { LeagueMembership } from '../../../../../shared/domain/enums/league-membership.enum.js';

@Schema({ timestamps: true, collection: 'users' })
export class UserDocument extends Document {
  @Prop({ required: true, unique: true, index: true })
  tokaUserId: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  avatarUrl: string;

  @Prop({
    type: Number,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'totalPoints debe ser un entero',
    },
  })
  totalPoints: number;

  @Prop({ default: Division.BRONCE, enum: Object.values(Division) })
  currentDivision: string;

  @Prop({ default: 0, type: Number })
  currentStreak: number;

  @Prop({ type: Date })
  lastPlayedDate: Date;

  @Prop({
    default: LeagueMembership.FREE,
    enum: Object.values(LeagueMembership),
  })
  leagueMembership: string;

  @Prop()
  tokaAccessToken: string;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
UserSchema.index({ tokaUserId: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ currentDivision: 1, totalPoints: -1 });
