//app.module.ts
require('dotenv').config();
import configuration from './config/configuration';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { MeetingsModule } from './meetings/meetings.module';
import { CalendarModule } from './calendar/calendar.module';
import { GoogleModule } from './google/google.module';
import { PusherService } from './pusher/pusher.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

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
    GoogleModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      context: ({ req }) => ({ req }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PusherService],
})
export class AppModule {}
