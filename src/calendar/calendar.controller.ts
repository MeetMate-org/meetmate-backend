//calendar.controller.ts
import { Controller, Post, Put, Delete, Body, Param, UseGuards, Req, Get, BadRequestException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { AccessKeyGuard } from '../guards/access-key.guard';
import { UserService } from '../user/user.service';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly userService: UserService
  ) {}

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async getUserEvents(@Body() body: { accessKey?: string }, @Req() req) {
    let user;
    if (body.accessKey) {
      const userId = await this.userService.getUserIdByAccessKey(body.accessKey);
      if (!userId) {
        throw new BadRequestException('Invalid AccessKey');
      }
      user = await this.userService.getUserByIdForAuth(userId);
    } else {
      user = await this.userService.getUserByIdForAuth(req.user.userId);
    }
    return this.calendarService.getEvents(user);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, AccessKeyGuard)
  async createEvent(@Body() createEventDto: CreateEventDto, @Req() req) {
    const user = await this.userService.getUserByIdForAuth(req.user.userId);
    return this.calendarService.createEvent(createEventDto, user);
  }

  @Put('edit/:eventId')
  @UseGuards(JwtAuthGuard, AccessKeyGuard)
  async editEvent(
    @Param('eventId') eventId: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req
  ) {
    const user = await this.userService.getUserByIdForAuth(req.user.userId);
    return this.calendarService.editEvent(eventId, updateEventDto, user);
  }

  @Delete('delete/:eventId')
  @UseGuards(JwtAuthGuard, AccessKeyGuard)
  async deleteEvent(@Param('eventId') eventId: string, @Req() req) {
    const user = await this.userService.getUserByIdForAuth(req.user.userId);
    return this.calendarService.deleteEvent(eventId, user);
  }
}