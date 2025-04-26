import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from './meetings.schema';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { User, UserSchema } from 'src/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), 
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService], 
})
export class MeetingsModule {}