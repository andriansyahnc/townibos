import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminUserDocument = AdminUser & Document;

@Schema({ timestamps: true })
export class AdminUser {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string; // bcrypt hash

  @Prop({ enum: ['superadmin', 'admin'], required: true })
  role: string;

  // null for superadmin; required for role=admin
  @Prop({ type: Types.ObjectId, ref: 'Town', default: null })
  townId: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
