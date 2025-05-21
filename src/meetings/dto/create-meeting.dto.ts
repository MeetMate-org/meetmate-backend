//create-meeting.dto.ts
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description?: string;

  @IsDateString()  
  @IsNotEmpty()
  startTime: string; 

  @IsNotEmpty()
  duration: number;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  times: {
    value: string;
    votes: number;
  }[];

  @IsString()
  @IsNotEmpty()
  organizer: string;

  @IsString()
  @IsNotEmpty()
  organizerName: string;

  @IsString()
  @IsNotEmpty()
  participants: string[];

  @IsString()
  link?: string;
}