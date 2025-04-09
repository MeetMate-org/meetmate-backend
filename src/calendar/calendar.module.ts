import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
