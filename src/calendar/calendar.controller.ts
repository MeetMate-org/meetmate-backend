import { Controller, Post, Patch, Delete, Body, Req, UseGuards, Param, Get, } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../user/jwt.auth.guard';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('create-event')
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @Req() req,
    @Body() body: {
      userId: string;
      accessKey: string;
      title: string;
      location?: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
    },
  ) {
    const creatorId = req.user.userId;
    return this.calendarService.createEvent({
      ...body,
      creatorId,
    });
  }

  @Patch('update-event')
  @UseGuards(JwtAuthGuard)
  async updateEvent(
    @Req() req,
    @Body() body: {
      calendarOwnerId: string;
      accessKey: string;
      eventId: string;
      title?: string;
      location?: string;
      description?: string;
      startDateTime?: string;
      endDateTime?: string;
    },
  ) {
    const requesterId = req.user.userId;
    return this.calendarService.updateEvent({
      ...body,
      requesterId,
    });
  }

  @Delete('delete-event/:eventId')
  @UseGuards(JwtAuthGuard)
  async deleteEvent(
    @Req() req,
    @Param('eventId') eventId: string,
    @Body() body: {
      calendarOwnerId: string;
      accessKey: string;
    },
  ) {
    const requesterId = req.user.userId;
    return this.calendarService.deleteEvent({
      eventId,
      calendarOwnerId: body.calendarOwnerId,
      accessKey: body.accessKey,
      requesterId,
    });
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@Req() req) {
    const userId = req.user.userId;
    return this.calendarService.getMyGoogleEvents(userId);
  }


}
