import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingProps } from 'src/interfaces/meetingProps';
import { JwtAuthGuard } from 'src/user/jwt.auth.guard';
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

  @Get("/user/:userId")
  @ApiResponse({ status: 200, description: 'Meetings found' })
  @ApiResponse({ status: 404, description: 'Meetings not found' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiBody({
    type: String,
    description: 'User ID to fetch meetings which are organized by this user',
    required: true,
  })
  @UseGuards(JwtAuthGuard)
  async getMeetingsByUserId(@Param('userId') userId: string) {
    return this.meetingsService.getMeetingsByUserId(userId);
  }

  @Get("/all")
  @ApiResponse({ status: 200, description: 'All meetings found' })
  @ApiResponse({ status: 404, description: 'Meetings not found' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiBody({
    type: String,
    description: 'Fetch all meetings',
    required: true,
  })
  @UseGuards(JwtAuthGuard)
  async getAllMeetings() {
    return this.meetingsService.getAllMeetings();
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
          endTime: '2023-10-01T11:00:00Z',
          times: [
            { value: '2023-10-01T10:00:00Z', votes: 5 },
            { value: '2023-10-01T11:00:00Z', votes: 3 },
          ],
          createdAt: new Date().toISOString(),
          organizer: 'John Doe',
          participants: ['Alice', 'Bob'],
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
      endTime: new Date(meetingProps.endTime).toISOString(),
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

  @Patch("/edit/:id")
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
      endTime: new Date(meetingProps.endTime).toISOString(),
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
}