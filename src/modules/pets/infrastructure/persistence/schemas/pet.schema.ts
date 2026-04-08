import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'pets' })
export class PetDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, minlength: 3, maxlength: 20 })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'PetItemDocument' }], default: [] })
  unlockedItems: Types.ObjectId[];

  @Prop({
    type: {
      hat: { type: Types.ObjectId, ref: 'PetItemDocument', default: null },
      shirt: { type: Types.ObjectId, ref: 'PetItemDocument', default: null },
      accessory: { type: Types.ObjectId, ref: 'PetItemDocument', default: null },
    },
    default: { hat: null, shirt: null, accessory: null },
  })
  equippedItems: {
    hat: Types.ObjectId | null;
    shirt: Types.ObjectId | null;
    accessory: Types.ObjectId | null;
  };
}

export const PetSchema = SchemaFactory.createForClass(PetDocument);
PetSchema.index({ userId: 1 }, { unique: true });
