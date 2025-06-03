//update-free-time.dto.ts
import { IsObject } from 'class-validator';

export class UpdateFreeTimeDto {
  @IsObject()
  freeTime: {
    [key: string]: { start: string; end: string }[];
  };
}