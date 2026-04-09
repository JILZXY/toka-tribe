import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SeasonStatus } from '../../../../../shared/domain/enums/season-status.enum.js';

@Schema({ timestamps: true, collection: 'seasons' })
export class SeasonDocument extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: SeasonStatus.ACTIVE, enum: Object.values(SeasonStatus) })
  status: string;

  @Prop({ type: Number, default: 50000 })
  targetPoints: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: {
      topPercentPromote: { type: Number, default: 20 },
      bottomPercentRelegate: { type: Number, default: 20 },
    },
    default: { topPercentPromote: 20, bottomPercentRelegate: 20 },
  })
  promotionRules: {
    topPercentPromote: number;
    bottomPercentRelegate: number;
  };
}

export const SeasonSchema = SchemaFactory.createForClass(SeasonDocument);
SeasonSchema.index({ status: 1 });
SeasonSchema.index({ endDate: 1, status: 1 });
