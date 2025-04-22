//update-event.dto.ts
import { IsString, IsDateString, IsOptional, IsArray } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  attendees?: string[];

  @IsOptional()
  @IsString()
  creatorMeetMateId: string; 
}
