import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TownDocument = Town & Document;

@Schema({ timestamps: true })
export class Town {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ required: true })
  notionDatabaseId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const TownSchema = SchemaFactory.createForClass(Town);
