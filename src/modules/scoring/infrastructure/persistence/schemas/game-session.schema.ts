import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'game_sessions' })
export class GameSessionDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ChallengeDocument', required: true })
  challengeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TribeDocument', required: true })
  tribeId: Types.ObjectId;

  @Prop({ type: Number, required: true, validate: { validator: Number.isInteger, message: 'score debe ser entero' } })
  score: number;

  @Prop({ type: Number, required: true, validate: { validator: Number.isInteger, message: 'pointsEarned debe ser entero' } })
  pointsEarned: number;

  @Prop()
  durationMs: number;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;

  @Prop({ default: Date.now })
  playedAt: Date;
}

export const GameSessionSchema = SchemaFactory.createForClass(GameSessionDocument);
GameSessionSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
GameSessionSchema.index({ tribeId: 1, challengeId: 1, pointsEarned: -1 });
GameSessionSchema.index({ userId: 1, playedAt: -1 });
