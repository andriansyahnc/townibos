import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ type: Types.ObjectId, ref: 'Town', required: true })
  townId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ enum: ['general', 'maintenance', 'payment', 'emergency'], default: 'general' })
  category: string;

  @Prop({ default: false })
  broadcastTelegram: boolean;

  @Prop()
  scheduledAt: Date;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
