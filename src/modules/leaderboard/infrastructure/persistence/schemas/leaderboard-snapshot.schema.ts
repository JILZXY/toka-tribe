import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Division } from '../../../../../shared/domain/enums/division.enum.js';

@Schema({ collection: 'leaderboard_snapshots' })
export class LeaderboardSnapshotDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'SeasonDocument', required: true })
  seasonId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(Division) })
  division: string;

  @Prop({ type: Types.ObjectId, ref: 'TribeDocument', required: true })
  tribeId: Types.ObjectId;

  @Prop({ required: true })
  rank: number;

  @Prop({ type: Number, required: true, validate: { validator: Number.isInteger, message: 'points debe ser entero' } })
  points: number;

  @Prop({ default: false })
  isFinalSnapshot: boolean;

  @Prop({ default: 1.0 })
  multiplierAssigned: number;

  @Prop({ default: Date.now })
  snapshotAt: Date;
}

export const LeaderboardSnapshotSchema = SchemaFactory.createForClass(LeaderboardSnapshotDocument);
LeaderboardSnapshotSchema.index({ seasonId: 1, division: 1, rank: 1 });
LeaderboardSnapshotSchema.index({ tribeId: 1, seasonId: 1, isFinalSnapshot: 1 });
LeaderboardSnapshotSchema.index({ snapshotAt: 1 }, { expireAfterSeconds: 7776000 });
