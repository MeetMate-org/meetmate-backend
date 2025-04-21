import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meeting, MeetingDocument, MeetingPlainObject } from './meetings.schema';
import { Model } from 'mongoose';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(@InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>) {}
  async getMeetingById(id: string): Promise<Meeting> {
    const meeting = await this.meetingModel.findById(id).exec();
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    return meeting;
  }

  async getMeetingsByUserId(userId: string): Promise<Meeting[]> {
    const meetings = await this.meetingModel.find({
      organizer: userId
    });

    return meetings;
  }

  async createMeeting(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    const meetingData = {
      ...createMeetingDto,
      startTime: new Date(createMeetingDto.startTime),
      endTime: new Date(createMeetingDto.endTime),
      times: createMeetingDto.times.map((time) => ({
        ...time,
        value: new Date(time.value),
      })),
    };
    
    
    const createdMeeting = new this.meetingModel(meetingData);
    return createdMeeting.save();
  }
  

  async deleteMeeting(id: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(id);
    await this.meetingModel.findByIdAndDelete(id).exec();
    return meeting;
  }

  async updateMeeting(
    id: string,
    updateMeetingDto: UpdateMeetingDto,
  ): Promise<Meeting> {
    const existingMeeting = await this.meetingModel.findById(id).lean<MeetingPlainObject>().exec();
    
    if (!existingMeeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
  
    const updatedData = {
      ...existingMeeting,
      ...updateMeetingDto,
      startTime: updateMeetingDto.startTime ? new Date(updateMeetingDto.startTime) : existingMeeting.startTime,
      endTime: updateMeetingDto.endTime ? new Date(updateMeetingDto.endTime) : existingMeeting.endTime,
      _id: existingMeeting._id, 
    };
  
    const updatedMeeting = await this.meetingModel.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    ).exec();

    if (!updatedMeeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found after update`);
    }

    return updatedMeeting;
  }

  async voteMeeting(id: string, vote: number): Promise<Meeting> {
    const meeting = await this.meetingModel.findById(id).exec();
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
  
    console.log(meeting.times);
  
    // Перевірка валідності індексу vote
    if (vote < 0 || vote >= meeting.times.length) {
      throw new NotFoundException(`Invalid vote index for meeting with ID ${id}`);
    }
  
    // Знаходимо індекс часу
    const timeIndex = meeting.times.findIndex((time, index) => index === vote);
    if (timeIndex === -1 || !meeting.times[timeIndex]) {
      throw new NotFoundException(`Time slot not found for meeting with ID ${id}`);
    }
  
    // Збільшуємо кількість голосів
    meeting.times[timeIndex].votes += 1;
  
    // Оновлюємо документ у базі даних
    const updatedMeeting = await this.meetingModel.findByIdAndUpdate(
      id,
      { times: meeting.times },
      { new: true }
    ).exec();
  
    if (!updatedMeeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found after voting`);
    }
  
    return updatedMeeting;
}
}