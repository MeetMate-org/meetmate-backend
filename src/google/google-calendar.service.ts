//google-calendar.service.ts
import { Injectable } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthService } from './google-auth.service';
import { CreateEventDto } from '../calendar/dto/create-event.dto';
import { UpdateEventDto } from '../calendar/dto/update-event.dto';
import { User } from '../user/user.schema';
import { GoogleEventDto } from '../calendar/dto/google-event.dto';

@Injectable()
export class GoogleCalendarService {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  private async getAuthenticatedClient(user: User): Promise<calendar_v3.Calendar> {
    const accessToken = await this.googleAuthService.getValidAccessToken(user);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async getEventById(eventId: string, user: User) {
    const calendar = await this.getAuthenticatedClient(user);
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });
    return event.data;
  }

  async createEvent(createEventDto: CreateEventDto, user: User) {
    const calendar = await this.getAuthenticatedClient(user);

    const event: calendar_v3.Schema$Event = {
      summary: createEventDto.title,
      start: { dateTime: createEventDto.startTime, timeZone: 'UTC' },
      location: createEventDto.location,
      description: createEventDto.description,
      attendees: createEventDto.attendees?.map((email) => ({ email })) || [],
      extendedProperties: {
        private: {
          creatorMeetMateId: createEventDto.creatorMeetMateId || user._id.toString(),
          ownerId: user._id.toString(),
        },
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return createdEvent.data;
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto, user: User) {
    const calendar = await this.getAuthenticatedClient(user);

    // Отримуємо поточну подію, щоб перенести існуючі розширені властивості
    const currentEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId,
    });

    const existingExtendedProperties = currentEvent.data.extendedProperties?.private || {};

    const event: calendar_v3.Schema$Event = {
        summary: updateEventDto.title,
        start: updateEventDto.startTime ? { dateTime: updateEventDto.startTime, timeZone: 'UTC' } : undefined,
        location: updateEventDto.location,
        description: updateEventDto.description,
        attendees: updateEventDto.attendees?.map((email) => ({ email })) || [],
        extendedProperties: {
            private: {
                ...existingExtendedProperties, // Зберігаємо старі розширені властивості
                creatorMeetMateId: updateEventDto.creatorMeetMateId || user._id.toString(),
                ownerId: user._id.toString(),
            },
        },
    };

    const updatedEvent = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
    });

    return updatedEvent.data;
}

  async deleteEvent(eventId: string, user: User) {
    const calendar = await this.getAuthenticatedClient(user);
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return { message: 'Event successfully deleted' };
  }

  async getEvents(user: User): Promise<GoogleEventDto[]> {
    const calendar = await this.getAuthenticatedClient(user);

    const now = new Date();
    const maxDate = new Date();
    maxDate.setMonth(now.getMonth() + 1);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: maxDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const allEvents = response.data.items || [];

    return allEvents.map((event) => ({
      id: event.id!,
      summary: event.summary || '',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      attendees: event.attendees || [],
      hangoutLink: event.hangoutLink,
      isMeetMateEvent: Boolean(event.extendedProperties?.private?.creatorMeetMateId),
    }));
  }
}