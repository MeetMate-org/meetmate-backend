//calendar.module.ts
import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { UserModule } from '../user/user.module';
import { GoogleModule } from '../google/google.module';
import { CalendarResolver } from './calendar.resolver';

@Module({
  imports: [UserModule, GoogleModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarResolver],
})
export class CalendarModule {}