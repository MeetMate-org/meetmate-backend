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

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  times: {
    value: string;
    votes: number;
  }[];
}