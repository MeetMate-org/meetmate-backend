//user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  otpSecret?: string;

  @Prop({ type: Date }) // Явно вказуємо тип Date
  otpExpires?: Date;

  @Prop()
  avatar?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  accessKey?: string;

  @Prop()
  googleAccessToken?: string;

  @Prop()
  googleRefreshToken?: string;

  @Prop()
  googleTokenExpiryDate?: Date;

  _id: string;
}

export const UserSchema = SchemaFactory.createForClass(User);