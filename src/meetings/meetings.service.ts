import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meeting, MeetingDocument, MeetingPlainObject } from './meetings.schema';
import { Model } from 'mongoose';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { UserService } from '../user/user.service';
import { PusherService } from '../pusher/pusher.service';
import { User, UserDocument } from '../user/user.schema';
import { Notification } from '../notifications/notification.schema';

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
    notification: { 
      to: string[];
      message: { title: string; startTime: Date; endTime: Date }; 
      organizer: string; 
    }
  ) {
    try {
      // Перевірка наявності користувачів
      const users = await this.userModel.find({ email: { $in: notification.to } });
      if (!users || users.length === 0) {
        throw new NotFoundException('No users found for the provided emails');
      }
  
      if (!notification.organizer) {
        throw new BadRequestException('Organizer email is required');
      }
  
      // Додаємо повідомлення до кожного користувача
      for (const user of users) {
        await this.userService.addNotification(user._id.toString(), {
          message: notification.message,
          organizer: notification.organizer,
        });
      }
  
      // Викликаємо Pusher для надсилання повідомлення
      const pusherData = {
        message: notification.message,
        organizer: notification.organizer,
        to: notification.to,
      };
      
  
      const participants = notification.to.filter(email => email !== notification.organizer);
      for (const participant of participants) {
        console.log('Triggering Pusher for participant:', participant);
        
        await this.pusherService.trigger(
          "meetmate-channel",
          participant,
          pusherData,
        );
      }
  
      return { message: 'Notification sent and saved successfully' };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new BadRequestException('Failed to create notification');
    }
  }

  async getUserNotifications(userId: string) {
    const user = await this.userService.getAccount(userId);
    return user.notifications;
  }
}