import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnitDocument = Unit & Document;

@Schema({ timestamps: true })
export class Unit {
  @Prop({ type: Types.ObjectId, ref: 'Town', required: true })
  townId: Types.ObjectId;

  @Prop({ required: true })
  number: string;

  @Prop({ required: true })
  block: string;

  @Prop({ required: true })
  floor: number;

  @Prop({ required: true })
  type: string; // e.g. 'A', 'B', 'C' or '1BR', '2BR'

  @Prop({ enum: ['occupied', 'vacant', 'maintenance'], default: 'vacant' })
  status: string;

  @Prop()
  area: number; // in m²
}

export const UnitSchema = SchemaFactory.createForClass(Unit);
