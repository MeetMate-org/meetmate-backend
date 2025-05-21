//calendar.resolver.ts
import { Resolver, Query, Args } from '@nestjs/graphql';
import { CalendarService } from './calendar.service';
import { GoogleEventDto } from './dto/google-event.dto';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../guards/gql-jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserService } from '../user/user.service';

@Resolver('Event')
export class CalendarResolver {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly userService: UserService,
  ) {}

  @Query(() => [GoogleEventDto], { name: 'events' })
  @UseGuards(GqlJwtAuthGuard)
  async getEvents(
    @Args('from') from: string,
    @Args('to') to: string,
    @CurrentUser() userPayload: any
  ): Promise<GoogleEventDto[]> {
    const user = await this.userService.getUserByIdForAuth(userPayload.userId);
    if (!user) throw new Error('User not found');
    return this.calendarService.getEventsByPeriod(user, from, to);
  }
}