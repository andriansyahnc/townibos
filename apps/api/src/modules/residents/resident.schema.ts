import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResidentDocument = Resident & Document;

@Schema({ timestamps: true })
export class Resident {
  @Prop({ required: true })
  name: string;

  @Prop({ sparse: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  telegramChatId: string;

  @Prop({ type: Types.ObjectId, ref: 'Town', required: true })
  townId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Unit' })
  unitId: Types.ObjectId;

  @Prop({ enum: ['owner', 'tenant'], default: 'tenant' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ResidentSchema = SchemaFactory.createForClass(Resident);
