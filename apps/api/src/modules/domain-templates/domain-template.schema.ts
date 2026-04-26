import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DomainTemplateDocument = DomainTemplate & Document;

@Schema({ timestamps: true })
export class DomainTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ required: true })
  memberLabel: string;

  @Prop({ required: true })
  assetLabel: string;

  @Prop({ required: true })
  documentLabel: string;

  @Prop({ required: true })
  ragRole: string;

  @Prop({ required: true })
  portalTitle: string;

  @Prop({ type: [String], default: ['residents', 'announcements', 'payments', 'regulations', 'units'] })
  enabledModules: string[];
}

export const DomainTemplateSchema = SchemaFactory.createForClass(DomainTemplate);
