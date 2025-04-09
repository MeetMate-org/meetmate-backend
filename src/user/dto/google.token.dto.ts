import { IsString, IsDateString } from "class-validator";

export class SaveGoogleTokensDto {
    @IsString()
    userId: string;
  
    @IsString()
    accessToken: string;
  
    @IsString()
    refreshToken: string;
  
    @IsDateString()
    expiryDate: string;
  }