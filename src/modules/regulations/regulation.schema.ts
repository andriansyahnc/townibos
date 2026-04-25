import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RegulationDocument = Regulation & Document;

@Schema({ timestamps: true })
export class Regulation {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ enum: ['tata_tertib', 'iuran', 'fasilitas', 'parkir', 'hewan', 'renovasi', 'lainnya'] })
  category: string;

  // Notion page ID — set when synced from Notion; used as upsert key
  @Prop({ sparse: true, unique: true })
  notionPageId: string;

  // Stored embedding for semantic search
  @Prop({ type: [Number] })
  embedding: number[];
}

export const RegulationSchema = SchemaFactory.createForClass(Regulation);
