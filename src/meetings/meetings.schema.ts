import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema() 
export class Meeting {
  static name = 'Meeting';

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  participants: string[];

  @Prop({ required: true })
  organizer: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  times: {
    value: Date;
    votes: number;
  }[];

  @Prop({ required: false })
  link: string;
}

export type MeetingPlainObject = Omit<Meeting, 'id'> & {
  _id: string;
  __v?: number;
};

export type MeetingDocument = Meeting & Document & {
  toObject(): MeetingPlainObject;
};

export const MeetingSchema = SchemaFactory.createForClass(Meeting);