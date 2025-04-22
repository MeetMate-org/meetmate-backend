//calendar.service.ts
import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { GoogleCalendarService } from '../google/google-calendar.service';
import { User } from '../user/user.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GoogleEventDto } from './dto/google-event.dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  async createEvent(createEventDto: CreateEventDto, user: User) {
    this.logger.log(`Creating event for user ${user._id}`);
    return this.googleCalendarService.createEvent(createEventDto, user);
  }

  async editEvent(eventId: string, updateEventDto: UpdateEventDto, user: User) {
    this.logger.log(`Editing event ${eventId} for user ${user._id}`);
    const event = await this.googleCalendarService.getEventById(eventId, user);
    this.validateEventAccess(event, user);
    return this.googleCalendarService.updateEvent(eventId, updateEventDto, user);
  }

  async deleteEvent(eventId: string, user: User) {
    this.logger.log(`Deleting event ${eventId} for user ${user._id}`);
    const event = await this.googleCalendarService.getEventById(eventId, user);
    this.validateEventAccess(event, user);
    return this.googleCalendarService.deleteEvent(eventId, user);
  }

  async getEvents(user: User): Promise<GoogleEventDto[]> {
    this.logger.log(`Fetching events for user ${user._id}`);
    return this.googleCalendarService.getEvents(user);
  }

  private validateEventAccess(event: any, user: User) {
    const creatorMeetMateId = event?.extendedProperties?.private?.creatorMeetMateId;
    const ownerId = event?.extendedProperties?.private?.ownerId;

    if (creatorMeetMateId !== user._id.toString() && ownerId !== user._id.toString()) {
      throw new ForbiddenException('You do not have permission to access this event');
    }
  }
}