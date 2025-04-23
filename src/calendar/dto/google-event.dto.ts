// google-event.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class GoogleEventDto {
  @IsString()
  id: string;

  @IsString()
  summary: string;

  @IsString()
  description: string;

  @IsString()
  start: string;

  @IsString()
  end: string;

  @IsOptional()
  @IsString()
  hangoutLink?: string | null;

  @IsString()
  isMeetMateEvent: boolean;
}
