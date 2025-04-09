import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { google } from 'googleapis';
import { UserService } from '../user/user.service';

@Injectable()
export class CalendarService {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  constructor(private readonly userService: UserService) {}

  async createEvent(eventData: {
    userId: string;
    accessKey: string;
    title: string;
    location?: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    creatorId: string;
  }) {
    const user = await this.userService.getUserByAccessKey(
      eventData.userId,
      eventData.accessKey,
    );

    if (!user || !user.googleAccessToken) {
      throw new UnauthorizedException('User has not authorized calendar access');
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const event = {
      summary: eventData.title,
      location: eventData.location,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: 'UTC',
      },
      extendedProperties: {
        private: {
          creatorMeetMateId: eventData.creatorId,
        },
      },
    };

    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return res.data;
    } catch (error) {
      throw new Error('Error creating event: ' + error.message);
    }
  }

  async updateEvent(eventData: {
    calendarOwnerId: string;
    accessKey: string;
    eventId: string;
    title?: string;
    description?: string;
    location?: string;
    startDateTime?: string;
    endDateTime?: string;
    requesterId: string;
  }) {
    const user = await this.userService.getUserByAccessKey(
      eventData.calendarOwnerId,
      eventData.accessKey,
    );

    if (!user?.googleAccessToken) {
      throw new UnauthorizedException('User has no Google access token');
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const { data: existingEvent } = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventData.eventId,
    });

    const creatorId = existingEvent.extendedProperties?.private?.creatorMeetMateId;
    if (creatorId !== eventData.requesterId) {
      throw new ForbiddenException('You are not allowed to update this event');
    }

    const updatedEvent = {
      ...existingEvent,
      summary: eventData.title ?? existingEvent.summary,
      description: eventData.description ?? existingEvent.description,
      location: eventData.location ?? existingEvent.location,
      start: {
        dateTime: eventData.startDateTime ?? existingEvent.start?.dateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endDateTime ?? existingEvent.end?.dateTime,
        timeZone: 'UTC',
      },
    };

    const result = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventData.eventId,
      requestBody: updatedEvent,
    });

    return result.data;
  }

  async deleteEvent(params: {
    eventId: string;
    calendarOwnerId: string;
    accessKey: string;
    requesterId: string;
  }) {
    const { eventId, calendarOwnerId, accessKey, requesterId } = params;

    const user = await this.userService.getUserByAccessKey(calendarOwnerId, accessKey);

    if (!user?.googleAccessToken) {
      throw new UnauthorizedException('User has no Google access token');
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const { data: event } = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    const creatorId = event.extendedProperties?.private?.creatorMeetMateId;
    if (creatorId !== requesterId) {
      throw new ForbiddenException('You are not allowed to delete this event');
    }

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return { message: 'Event deleted successfully' };
  }

  async getMyGoogleEvents(userId: string) {
    const user = await this.userService.getUserByIdForAuth(userId);
  
    if (!user?.googleAccessToken) {
      throw new UnauthorizedException('Google Calendar is not authorized');
    }
  
    this.oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });
  
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });
  
    return res.data.items;
  }
  
}
