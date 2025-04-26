//calendar.controller.ts
import { Controller, Post, Put, Delete, Body, Param, UseGuards, Req, Get, BadRequestException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { AccessKeyGuard } from '../guards/access-key.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiHeader } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly userService: UserService
  ) {}

  @Get('events')
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiOperation({ summary: 'Get User Events', description: 'Retrieve all events for the authenticated user.' })
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
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiOperation({ summary: 'Create Event', description: 'Create a new event for the authenticated user.' })
  @ApiBody({ type: CreateEventDto })
  @UseGuards(JwtAuthGuard, AccessKeyGuard)
  async createEvent(@Body() createEventDto: CreateEventDto, @Req() req) {
    const user = await this.userService.getUserByIdForAuth(req.user.userId);
    return this.calendarService.createEvent(createEventDto, user);
  }

  @Put('edit/:eventId')
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiOperation({ summary: 'Edit Event', description: 'Edit an existing event by its ID.' })
  @ApiParam({ name: 'eventId', description: 'ID of the event to edit' })
  @ApiBody({ type: UpdateEventDto })
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
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiOperation({ summary: 'Delete Event', description: 'Delete an event by its ID.' })
  @ApiParam({ name: 'eventId', description: 'ID of the event to delete' })
  @UseGuards(JwtAuthGuard, AccessKeyGuard)
  async deleteEvent(@Param('eventId') eventId: string, @Req() req) {
    const user = await this.userService.getUserByIdForAuth(req.user.userId);
    return this.calendarService.deleteEvent(eventId, user);
  }
}