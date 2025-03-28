import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { Meeting } from '../meetings.schema';
import { SchemaFactory } from '@nestjs/mongoose';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description?: string;

  @IsDateString()  
  @IsNotEmpty()
  startTime: string; 

  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}