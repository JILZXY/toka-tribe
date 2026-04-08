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
// Índice principal para el ranking por temporada y división (consulta más frecuente)
LeaderboardSnapshotSchema.index({ seasonId: 1, division: 1, rank: 1 });
// Índice para filtrar por tribu dentro de una temporada
LeaderboardSnapshotSchema.index({ tribeId: 1, seasonId: 1, isFinalSnapshot: 1 });
// Índice TTL: snapshots no finales expiran en 90 días (7776000 s)
LeaderboardSnapshotSchema.index({ snapshotAt: 1 }, { expireAfterSeconds: 7776000 });
// Índice de cobertura para paginación rápida (solo lee este índice, no el documento)
LeaderboardSnapshotSchema.index({ seasonId: 1, division: 1, points: -1, tribeId: 1 });
