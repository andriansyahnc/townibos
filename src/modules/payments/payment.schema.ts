import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  residentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Unit', required: true })
  unitId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['iuran', 'listrik', 'air', 'parkir', 'lainnya'], default: 'iuran' })
  type: string;

  @Prop({ required: true })
  period: string; // e.g. '2025-01'

  @Prop({ enum: ['pending', 'paid', 'overdue'], default: 'pending' })
  status: string;

  @Prop()
  paidAt: Date;

  @Prop()
  notes: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
