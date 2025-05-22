//meetings.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingProps } from 'src/interfaces/meetingProps';
import { JwtAuthGuard } from 'src/guards/jwt.auth.guard';
import { ApiBody, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get("/:id")
  @ApiResponse({ status: 200, description: 'Meeting found' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getMeetingById(@Param('id') id: string) {
    return this.meetingsService.getMeetingById(id);
  }

  @Get("user/all/:userId")
  @ApiResponse({ status: 200, description: 'All meetings found' })
  @ApiResponse({ status: 404, description: 'Meetings not found' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @UseGuards(JwtAuthGuard)
  async getAllMeetings(@Param('userId') userId: string) {
    return this.meetingsService.getAllMeetings(userId);
  }

  @Get("user/:userId")
  @ApiResponse({ status: 200, description: 'Meetings found' })
  @ApiResponse({ status: 404, description: 'Meetings not found' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @UseGuards(JwtAuthGuard)
  async getMeetingsByUserId(@Param('userId') userId: string) {
    return this.meetingsService.getMeetingsByUserId(userId);
  }

  @Get("user/attending/:userId")
  @ApiResponse({ status: 200, description: 'Meetings found' })
  @ApiResponse({ status: 404, description: 'Meetings not found' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @UseGuards(JwtAuthGuard)
  async getAttendingMeetings(@Param('userId') userId: string) {
    return this.meetingsService.getAttendingMeetings(userId);
  }

  @Post("create") 
  @ApiResponse({ status: 201, description: 'Meeting created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    type: CreateMeetingDto,
    examples: {
      example1: {
        summary: 'Example meeting',
        value: {
          title: 'Project Kickoff',
          description: 'Initial meeting to discuss project goals and timelines.',
          startTime: '2023-10-01T10:00:00Z',
          duration: 60,
          times: [
            { value: '2023-10-01T10:00:00Z', votes: 0 },
            { value: '2023-10-01T11:00:00Z', votes: 0 },
          ],
          createdAt: new Date().toISOString(),
          organizer: 'some_id',
          organizerName: 'John Doe',
          participants: ['alice@gmail.com', 'bob@gmail.com'],
        },
      },
    },
    description: 'Meeting properties',
    required: true,
  })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @UseGuards(JwtAuthGuard)
  async createMeeting(@Body() meetingProps: MeetingProps) {
    const transformedMeetingProps = {
      ...meetingProps,
      startTime: new Date(meetingProps.startTime).toISOString(),
      times: meetingProps.times.map((time) => ({
        value: new Date(time.value).toISOString(),
        votes: time.votes,
      })),
    };
    return this.meetingsService.createMeeting(transformedMeetingProps);
  }

  @Delete("/delete/:id")
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Meeting deleted' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  async deleteMeeting(@Param('id') id: string) {
    return this.meetingsService.deleteMeeting(id);
  }

  @Put("/edit/:id")
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Meeting updated' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiBody({
    type: UpdateMeetingDto,
    description: 'Updated meeting properties',
    required: true,
  })
  async updateMeeting(@Param('id') id: string, @Body() meetingProps: MeetingProps) {
    const transformedMeetingProps = {
      ...meetingProps,
      startTime: new Date(meetingProps.startTime).toISOString(),
    };
    return this.meetingsService.updateMeeting(id, transformedMeetingProps);
  }

  @Patch("/vote/:id")
  @ApiResponse({ status: 200, description: 'Vote counted' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiBody({
    type: Number,
    description: 'Vote value',
    required: true,
  })
  @UseGuards(JwtAuthGuard)
  async voteMeeting(@Param('id') id: string, @Body('vote') vote: number) {
    return this.meetingsService.voteMeeting(id, vote);
  }

  @Post('notification')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Notification created and sent' })
  @ApiBody({
    schema: {
      example: {
        message: {
          title: 'Daily meeting',
          startTime: '2025-04-28T10:00:00Z',
          duration: 60,
        },
        organizer: 'organizerName',
      },
    },
  })
  
  async createNotificationWithPusher(
    @Body() notification: { to: string[]; message: { title: string; startTime: Date; duration: number }; organizer: string }
  ) {
    return this.meetingsService.createNotificationWithPusher(notification);
  }

  @Get('notifications/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'User notifications retrieved' })
  async getUserNotifications(@Param('userId') userId: string) {
    return this.meetingsService.getUserNotifications(userId);
  }
}