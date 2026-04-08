import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GameType } from '../../../../../shared/domain/enums/game-type.enum.js';

@Schema({ timestamps: true, collection: 'games' })
export class GameDocument extends Document {
  @Prop({ required: true, enum: Object.values(GameType) })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Object, required: true })
  config: Record<string, unknown>;

  @Prop({ default: true })
  isActive: boolean;
}
export const GameSchema = SchemaFactory.createForClass(GameDocument);
