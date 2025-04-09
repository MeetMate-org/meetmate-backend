import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as crypto from 'crypto';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { SaveGoogleTokensDto } from './dto/google.token.dto';


@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(userProps: { username: string; email: string; password: string }) {
    const { username, email, password } = userProps;
    const existingEmail = await this.userModel.findOne({ email });
    if (existingEmail) {
      throw new Error('A user with this email address already exists.');
    }

    const existingUsername = await this.userModel.findOne({ username });
    if (existingUsername) {
      throw new Error('A user with that name already exists.');
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new this.userModel({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '48h' });
    return { token, userId: user._id };
  }

  async login(userProps: { identifier: string; password: string }) {
    const { identifier, password } = userProps;
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      throw new Error('Invalid username/email or password');
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid username/email or password');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '48h' });
    return { token, userId: user._id };
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  async generateAccessKey(userId: string) {
    const accessKey = crypto.randomBytes(32).toString('hex');
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { accessKey },
      { new: true }
    );
    if (!user) throw new Error('User not found');
    return { accessKey };
  }

  async getUserByAccessKey(userId: string, providedKey: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error('User not found');

    if (!user.accessKey || user.accessKey !== providedKey) {
      throw new Error('Access denied. Invalid accessKey.');
    }

    return {
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      googleAccessToken: user.googleAccessToken,
      googleRefreshToken: user.googleRefreshToken,
      googleTokenExpiryDate: user.googleTokenExpiryDate,
    };
  }

  async deleteAccessKey(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $unset: { accessKey: 1 } },
      { new: true }
    );
    if (!user) throw new Error('User not found');
    return { message: 'Access key deleted successfully' };
  } 
  
  async saveGoogleTokens(dto: SaveGoogleTokensDto) {
    const user = await this.userModel.findById(dto.userId);
    if (!user) throw new Error('User not found');
  
    user.googleAccessToken = dto.accessToken;
    user.googleRefreshToken = dto.refreshToken;
    user.googleTokenExpiryDate = new Date(dto.expiryDate);
  
    await user.save();
  
    return { message: 'Google tokens saved successfully' };
  }

  async getUserByIdForAuth(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }
}
