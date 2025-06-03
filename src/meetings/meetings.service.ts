import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meeting, MeetingDocument, MeetingPlainObject } from './meetings.schema';
import { Model } from 'mongoose';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { UserService } from '../user/user.service';
import { PusherService } from '../pusher/pusher.service';
import { User, UserDocument } from '../user/user.schema';

type TimeRange = { start: string; end: string };
type DaysOfWeek = 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';

function getDayOfWeek(date: Date): DaysOfWeek {
  const days: DaysOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
}

function intersectTimeRanges(rangesList: TimeRange[][]): TimeRange[] {
  if (rangesList.length === 0) return [];
  return rangesList.reduce((acc, curr) => {
    const result: TimeRange[] = [];
    for (const a of acc) {
      for (const b of curr) {
        const start = a.start > b.start ? a.start : b.start;
        const end = a.end < b.end ? a.end : b.end;
        if (start < end) result.push({ start, end });
      }
    }
    return result;
  });
}

function subtractBusyFromFree(free: TimeRange[], busy: TimeRange[]): TimeRange[] {
  let result = [...free];
  for (const busySlot of busy) {
    const temp: TimeRange[] = [];
    for (const freeSlot of result) {
      if (busySlot.end <= freeSlot.start || busySlot.start >= freeSlot.end) {
        temp.push(freeSlot);
      } else {
        if (busySlot.start > freeSlot.start) {
          temp.push({ start: freeSlot.start, end: busySlot.start });
        }
        if (busySlot.end < freeSlot.end) {
          temp.push({ start: busySlot.end, end: freeSlot.end });
        }
      }
    }
    result = temp;
  }
  return result;
}

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
      times: createMeetingDto.times.map((time) => ({
        ...time,
        value: new Date(time.value),
      })),
    };
    
    
    const createdMeeting = new this.meetingModel(meetingData);

    // send notifications to participants
    const notification = {
      to: createMeetingDto.participants,
      message: {
        title: createMeetingDto.title,
        startTime: new Date(createMeetingDto.startTime),
        duration: createMeetingDto.duration,
      },
      organizer: createMeetingDto.organizerName,
    };
    await this.createNotificationWithPusher(notification);
    
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
      message: { title: string; startTime: Date; duration: number }; 
      organizer: string; 
    }
  ) {
    try {
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

  async getOptimalTime(meetingId: string): Promise<any> {
    const meeting = await this.meetingModel.findById(meetingId).lean().exec();
    if (!meeting) throw new NotFoundException('Meeting not found');

    // 1. Збираємо всіх учасників (емейли) та організатора (id)
    const participantsEmails: string[] = meeting.participants || [];
    const organizerId: string = meeting.organizer;

    const organizer = await this.userModel.findById(organizerId).lean().exec();
    if (!organizer) throw new NotFoundException('Organizer not found');

    const participants = await this.userModel.find({ email: { $in: participantsEmails } }).lean().exec();
    const users = [organizer, ...participants];

    // 2. Готуємо список днів тижня
    const weekDays: DaysOfWeek[] = ['mon','tue','wed','thu','fri','sat','sun'];

    // 3. Для всіх користувачів знаходимо масив freeTime по кожному дню
    const availableByDay: Record<DaysOfWeek, TimeRange[][]> = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    };
    for (const day of weekDays) {
      for (const user of users) {
        if (user.freeTime && user.freeTime[day]) {
          availableByDay[day].push(user.freeTime[day]);
        } else {
          availableByDay[day].push([]);
        }
      }
    }

    // 4. Всі події всіх юзерів (organizer+participants), без дублікатів
    const userEmails = users.map(u => u.email);
    const userIds = users.map(u => u._id.toString());
    const allMeetings = await this.meetingModel.find({
      $or: [
        { organizer: { $in: userIds } },
        { participants: { $in: userEmails } }
      ]
    }).lean().exec();

    // Прибрати дублікати подій по _id
    const uniqueMeetingsMap = new Map<string, any>();
    for(const m of allMeetings) uniqueMeetingsMap.set(m._id.toString(), m);
    const uniqueMeetings = Array.from(uniqueMeetingsMap.values());

    // 5. Знаходимо всі зайняті слоти для всіх унікальних мітингів (по днях)
    const busyByDay: Record<DaysOfWeek, TimeRange[]> = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    };
    for (const bm of uniqueMeetings) {
      const start = new Date(bm.startTime);
      const day: DaysOfWeek = getDayOfWeek(start);
      const startStr = start.toTimeString().slice(0,5);
      const endDate = new Date(start.getTime() + (bm.duration || 0) * 60000);
      const endStr = endDate.toTimeString().slice(0,5);
      busyByDay[day].push({ start: startStr, end: endStr });
    }

    // 6. Для кожного дня — перетин freeTime всіх юзерів мінус зайняті слоти
    const optimalByDay: Record<DaysOfWeek, TimeRange[]> = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    };
    for (const day of weekDays) {
      const intersection = intersectTimeRanges(availableByDay[day]);
      optimalByDay[day] = subtractBusyFromFree(intersection, busyByDay[day]);
    }

    return {
      meetingId,
      participants: users.map(u => ({ id: u._id, email: u.email, username: u.username })),
      optimalTimeByDay: optimalByDay
    };
  }
}