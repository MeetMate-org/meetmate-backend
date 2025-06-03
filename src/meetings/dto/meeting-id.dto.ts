//meeting-id.dto.ts
import { IsString } from 'class-validator';

export class MeetingIdDto {
  emails: string[];

  @IsString()
  organizerId: string
}