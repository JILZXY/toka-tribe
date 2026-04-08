import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PetSlot } from '../../../../../shared/domain/enums/pet-slot.enum.js';

@Schema({ timestamps: true, collection: 'pet_items' })
export class PetItemDocument extends Document {
  @Prop({ required: true, unique: true })
  itemId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true, enum: Object.values(PetSlot) })
  slot: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'pointCost debe ser entero',
    },
  })
  pointCost: number;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop()
  seasonId: string;
}

export const PetItemSchema = SchemaFactory.createForClass(PetItemDocument);
PetItemSchema.index({ itemId: 1 }, { unique: true });
PetItemSchema.index({ slot: 1, isAvailable: 1, pointCost: 1 });
