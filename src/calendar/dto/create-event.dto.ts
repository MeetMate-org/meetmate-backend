//create-event.dto.ts
import { IsString, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  location: string;

  @IsString()
  description: string;

  @IsArray()
  attendees: string[];

  @IsOptional()
  @IsString()
  creatorMeetMateId: string;
}
