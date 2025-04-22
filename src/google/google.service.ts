//google.service.ts
import { Injectable } from '@nestjs/common';
import { google, Auth } from 'googleapis';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class GoogleService {
  private oauth2Client: Auth.OAuth2Client;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async getAuthenticatedClient(user: User): Promise<Auth.OAuth2Client> {
    const accessToken = await this.getValidAccessToken(user, user._id);

    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });

    return this.oauth2Client;
  }

  async getValidAccessToken(user: User, userId: string): Promise<string> {
    const now = new Date();
    const expiryDate = user.googleTokenExpiryDate;

    if (expiryDate && now < expiryDate) {
      return user.googleAccessToken!;
    }

    if (!user.googleRefreshToken) {
      throw new Error('Refresh token is missing.');
    }

    this.oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;
    const expiryDateNew = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    if (!newAccessToken) {
      throw new Error('Unable to refresh access token');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      googleAccessToken: newAccessToken,
      googleTokenExpiryDate: expiryDateNew,
    });

    return newAccessToken;
  }
}