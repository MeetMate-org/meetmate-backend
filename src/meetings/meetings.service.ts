import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meeting, MeetingDocument, MeetingPlainObject } from './meetings.schema';
import { Model } from 'mongoose';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { UserService } from 'src/user/user.service';
import { PusherService } from 'src/pusher/pusher.service';
import { User, UserDocument } from 'src/user/user.schema';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly pusherService: PusherService,
    private readonly userService: UserService,
  ) {}

  async getMeetingById(id: string): Promise<Meeting> {
    const meeting = await this.meetingModel.findById(id).lean<MeetingPlainObject>().exec();
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
    return meeting;
  }

  async getAllMeetings(userId: string): Promise<Meeting[]> {
    const user = await this.userModel.findById(userId).exec();

    const meetings = await this.meetingModel.find({
      // find meetings where the user is an organizer or participant
      $or: [
        { organizer: user?._id },
        { participants: user?.email }
      ]
    });

    return meetings.length > 0 ? meetings : [];
  }

  async getMeetingsByUserId(userId: string): Promise<Meeting[]> {
    const meetings = await this.meetingModel.find({
      organizer: userId
    });

    return meetings.length > 0 ? meetings : [];
  }

  async getAttendingMeetings(userId: string): Promise<Meeting[]> {
    try {
      const user = await this.userModel.findById(userId).exec();
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
      

      // retrieve meetings where the user with email is an attendee
      const meetings = await this.meetingModel.find({
        participants: user.email
      }).exec();

      return meetings.length > 0 ? meetings : [];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; 
      }
      throw new NotFoundException('User not found');
    }
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

  async createNotificationWithPusher(
    userId: string, 
    notification: { 
      message: { title: string; startTime: Date; endTime: Date }; 
      organizer: string; 
    }
  ) {
    // Оновлюємо користувача в базі даних
    const user = await this.userService.addNotification(userId, notification);

    // Викликаємо Pusher для надсилання повідомлення
    await this.pusherService.trigger('meetmate-channel', 'new-notification', notification);

    return { message: 'Notification sent and saved successfully' };
  }

  async getUserNotifications(userId: string) {
    const user = await this.userService.getUserById(userId);
    return user.notifications;
  }
}