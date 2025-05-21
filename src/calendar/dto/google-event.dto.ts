//google-event.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ObjectType, Field } from '@nestjs/graphql';

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
  start: string;

  @Field()
  @IsString()
  end: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  hangoutLink?: string | null;

  @Field()
  @IsString()
  creatorMeetMateId: string;
}