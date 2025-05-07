import { Schema, Document, model } from 'mongoose';

export interface NotificationDocument extends Document {
  message: {
    title: string;
    startTime: Date;
    endTime: Date;
  };
  organizer: string;
  to: string[];
}

const NotificationSchema = new Schema<NotificationDocument>({
  message: {
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  organizer: { type: String, required: true },
  to: { type: [String], required: true },
});

export const Notification = model<NotificationDocument>('Notification', NotificationSchema);