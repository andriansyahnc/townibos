import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FaqCacheDocument = FaqCache & Document;

@Schema({ timestamps: true })
export class FaqCache {
  @Prop({ type: Types.ObjectId, ref: 'Town', required: true, index: true })
  townId: Types.ObjectId;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Prop({ default: 0 })
  hitCount: number;

  @Prop()
  lastHitAt: Date;
}

export const FaqCacheSchema = SchemaFactory.createForClass(FaqCache);
