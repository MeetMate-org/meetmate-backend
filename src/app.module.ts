require('dotenv').config();
import configuration from './config/configuration';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { MeetingsController } from './meetings/meetings.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
     }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    UserModule,
  ],
  controllers: [AppController, MeetingsController],
  providers: [AppService],
})
export class AppModule {}
