import { Schema, Document, model } from 'mongoose';

export interface NotificationDocument extends Document {
  message: {
    title: string;
    startTime: Date;
    duration: number;
  };
  organizer: string;
  to: string[];
}

const NotificationSchema = new Schema<NotificationDocument>({
  message: {
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    duration: { type: Number, required: true },
  },
  organizer: { type: String, required: true },
  to: { type: [String], required: true },
});

export const Notification = model<NotificationDocument>('Notification', NotificationSchema);