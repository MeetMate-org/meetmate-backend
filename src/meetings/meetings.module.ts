import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from './meetings.schema';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
  ],
  providers: [MeetingsService],
  exports: [MeetingsService], 
})
export class MeetingsModule {}