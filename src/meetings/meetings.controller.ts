import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingProps } from 'src/interfaces/meetingProps';
import { JwtAuthGuard } from 'src/user/jwt.auth.guard';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get("/:id")
  async getMeetingById(@Param('id') id: string) {
    return this.meetingsService.getMeetingById(id);
  }

  @Post("create") 
  @UseGuards(JwtAuthGuard)
  async createMeeting(@Body() meetingProps: MeetingProps) {
    const transformedMeetingProps = {
      ...meetingProps,
      startTime: new Date(meetingProps.startTime).toISOString(),
      endTime: new Date(meetingProps.endTime).toISOString(),
    };
    return this.meetingsService.createMeeting(transformedMeetingProps);
  }

  @Delete("/delete/:id")
  @UseGuards(JwtAuthGuard)
  async deleteMeeting(@Param('id') id: string) {
    return this.meetingsService.deleteMeeting(id);
  }

  @Patch("/edit/:id")
  @UseGuards(JwtAuthGuard)
  async updateMeeting(@Param('id') id: string, @Body() meetingProps: MeetingProps) {
    const transformedMeetingProps = {
      ...meetingProps,
      startTime: new Date(meetingProps.startTime).toISOString(),
      endTime: new Date(meetingProps.endTime).toISOString(),
    };
    return this.meetingsService.updateMeeting(id, transformedMeetingProps);
  }
}