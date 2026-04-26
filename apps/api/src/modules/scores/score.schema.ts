import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScoreDocument = Score & Document;

@Schema({ timestamps: true })
export class Score {
  @Prop({ type: Types.ObjectId, ref: 'Town', required: true })
  townId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  residentId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  period: string; // e.g. '2025-1'

  @Prop({ required: true, min: 0, max: 100 })
  score: number;

  @Prop({ enum: ['daily', 'mid', 'final'], default: 'daily' })
  type: string;

  @Prop()
  notes: string;
}

export const ScoreSchema = SchemaFactory.createForClass(Score);
