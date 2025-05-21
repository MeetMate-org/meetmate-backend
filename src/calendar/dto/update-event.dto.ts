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
  duration: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];

  @IsOptional()
  @IsString()
  creatorMeetMateId?: string;
}