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

  @Prop()
  refreshToken?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  otpSecret?: string;

  @Prop({ type: Date })
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

  @Prop({ type: [{ 
    message: { 
      title: String, 
      startTime: Date, 
      duration: Number 
    }, 
    organizer: String 
  }], default: [] })
  notifications: {
    message: {
      title: string;
      startTime: Date;
      duration: number;
    };
    organizer: string;
  }[];

  @Prop({
    type: Object,
    default: {
      mon: [{ start: '09:00', end: '17:00' }],
      tue: [{ start: '09:00', end: '17:00' }],
      wed: [{ start: '09:00', end: '17:00' }],
      thu: [{ start: '09:00', end: '17:00' }],
      fri: [{ start: '09:00', end: '17:00' }],
      sat: [],
      sun: []
    }
  })
  freeTime: {
    [day: string]: { start: string; end: string }[];
  };

  _id: string;
}

export const UserSchema = SchemaFactory.createForClass(User);