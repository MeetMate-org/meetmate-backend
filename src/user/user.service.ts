//user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as crypto from 'crypto';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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
    const accessKey = crypto.randomBytes(32).toString('hex');

    const user = new this.userModel({ username, email, password: hashedPassword, accessKey });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '48h' });
    return { token, userId: user._id, accessKey }; // Повертаємо оригінальний accessKey у відповіді
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '48h' });
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

  async getUserIdByAccessKey(accessKey: string): Promise<string | null> {
    const user = await this.userModel.findOne({ accessKey });
    return user ? user._id.toString() : null;
  }

  async generateAccessKey(userId: string): Promise<{ accessKey: string }> {
    const accessKey = crypto.randomBytes(32).toString('hex');

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { accessKey },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return { accessKey }; // Повертаємо оригінальний accessKey
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

  async deleteGoogleTokens(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $unset: { googleAccessToken: 1, googleRefreshToken: 1, googleTokenExpiryDate: 1 } },
      { new: true }
    );

    if (!user) throw new Error('User not found');
    return { message: 'Google tokens deleted successfully' };
  }

  async getUserByIdForAuth(userId: string): Promise<User> {
    if (!userId) {
      throw new Error('User ID is missing');
    }
  
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
  
    return user;
  }
}