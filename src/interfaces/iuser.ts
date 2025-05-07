//iuser.ts
export interface IUser {
  username: string;
  email: string;
  password: string;
  isVerified: boolean;
  otpSecret?: string;
  otpExpires?: Date;
  createdAt: Date;
  accessKey?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiryDate?: Date;
  notifications: {
    message: {
      title: string;
      startTime: Date;
      endTime: Date;
    };
    organizer: string;
  }[];
}