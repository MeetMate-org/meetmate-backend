//meetings.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from './meetings.schema';
import { MeetingsService } from './meetings.service';
import { PusherService } from 'src/pusher/pusher.service';
import { UserModule } from 'src/user/user.module';
import { MeetingsController } from './meetings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
    UserModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, PusherService],
  exports: [MeetingsService, PusherService], 
})
export class MeetingsModule {}