require('dotenv').config();
import configuration from './config/configuration';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { MeetingsController } from './meetings/meetings.controller';
import { MeetingsModule } from './meetings/meetings.module';
import { CalendarController } from './calendar/calendar.controller';
import { CalendarService } from './calendar/calendar.service';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
     }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    UserModule,
    MeetingsModule,
    CalendarModule,
  ],
  controllers: [AppController, MeetingsController, CalendarController],
  providers: [AppService, CalendarService],
})
export class AppModule {}
