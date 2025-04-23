//google.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleService } from './google.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import { UserModule } from 'src/user/user.module';
import { GoogleController } from './google.controller';
import { GoogleAuthService } from './google-auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UserModule),
  ],
  controllers: [GoogleController],
  providers: [
    GoogleService,
    GoogleCalendarService,
    GoogleAuthService,
  ],
  exports: [
    GoogleCalendarService,
    GoogleAuthService,
  ],
})
export class GoogleModule {}
