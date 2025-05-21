//create-event.dto.ts
import { IsString, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsDateString()
  startTime: string;

  @IsString()
  duration: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  attendees: string[];

  @IsOptional()
  @IsString()
  creatorMeetMateId?: string;
}