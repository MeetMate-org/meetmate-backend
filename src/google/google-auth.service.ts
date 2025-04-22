//google-auth.servise.ts
import { Injectable, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private oauth2Client: OAuth2Client;

  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async generateAuthUrl(userId: string): Promise<{ url: string }> {
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: userId,
    });
    return { url };
  }

  async handleAuthCallback(userId: string, code: string): Promise<{ message: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to retrieve tokens from Google');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiryDate: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000),
    });

    return { message: 'Google authorization successful' };
  }

  async getValidAccessToken(user: User): Promise<string> {
    console.log('User object in getValidAccessToken:', user);
  
    const now = new Date();
  
    if (user.googleTokenExpiryDate && now < user.googleTokenExpiryDate) {
      return user.googleAccessToken!;
    }
  
    if (!user.googleRefreshToken) {
      throw new Error(`User ${user._id} is missing a refresh token.`);
    }
  
    this.oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
  
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }
  
      await this.userModel.findByIdAndUpdate(user._id, {
        googleAccessToken: credentials.access_token,
        googleTokenExpiryDate: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600 * 1000),
      });
  
      return credentials.access_token;
    } catch (error) {
      console.error(`Error refreshing access token for user ${user._id}:`, error);
      throw new Error('Unable to refresh access token');
    }
  }
}