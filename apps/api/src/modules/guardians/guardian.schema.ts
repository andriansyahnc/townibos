import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GuardianDocument = Guardian & Document;

@Schema({ timestamps: true })
export class Guardian {
  @Prop({ type: Types.ObjectId, ref: 'Town', required: true })
  townId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  relationship: string; // 'Ayah', 'Ibu', 'Wali', etc.
}

export const GuardianSchema = SchemaFactory.createForClass(Guardian);
