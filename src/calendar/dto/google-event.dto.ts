//google-event.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('Event')
export class GoogleEventDto {
  @Field()
  @IsString()
  id: string;

  @Field()
  @IsString()
  summary: string;

  @Field()
  @IsString()
  description: string;

  @Field()
  @IsString()
  startTime: string; // ВИПРАВЛЕНО!

  @Field(() => Int)
  @IsInt()
  duration: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  hangoutLink?: string | null;

  @Field()
  @IsString()
  creatorMeetMateId: string;
}