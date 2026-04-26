import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RegulationDocument = Regulation & Document;

@Schema({ timestamps: true })
export class Regulation {
  @Prop({ type: Types.ObjectId, ref: 'Town', required: true })
  townId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  category: string;

  @Prop({ enum: ['notion', 'pdf', 'manual'], default: 'manual' })
  source: string;

  @Prop({ default: () => new Date() })
  effectiveDate: Date;

  @Prop({ enum: ['aktif', 'arsip'], default: 'aktif' })
  status: string;

  // Notion page ID — set when synced from Notion; used as upsert key
  @Prop({ sparse: true, unique: true })
  notionPageId: string;

  // Stored embedding for semantic search
  @Prop({ type: [Number] })
  embedding: number[];
}

export const RegulationSchema = SchemaFactory.createForClass(Regulation);
