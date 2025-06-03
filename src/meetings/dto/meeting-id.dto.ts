//meeting-id.dto.ts
import { IsString } from 'class-validator';

export class MeetingIdDto {
  @IsString()
  _id: string; // ID мітингу
}