//user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as crypto from 'crypto';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import * as speakeasy from 'speakeasy';
import { IUser } from 'src/interfaces/iuser';

@Injectable()
export class UserService {
  private transporter: nodemailer.Transporter;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.HOST_ADDRESS,
        pass: process.env.HOST_PASSWORD,
      },
    });
  }

  async register(userProps: { username: string; email: string; password: string }) {
    const { username, email, password } = userProps;

    // Перевірка наявності користувача з таким email або username.
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      throw new Error('A user with this email or username already exists.');
    }

    const otpSecret = speakeasy.generateSecret({ length: 20 });
    const otpToken = speakeasy.totp({
      secret: otpSecret.base32,
      encoding: 'base32',
    });

    // Створення хешу пароля
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Генерація accessKey
    const accessKey = crypto.randomBytes(32).toString('hex');

    // Створення нового користувача
    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      otpSecret: otpSecret.base32,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // OTP дійсний 10 хвилин
      isVerified: false,
      accessKey,
    });

    await newUser.save();

    // Надсилання OTP на email
    await this.transporter.sendMail({
      from: process.env.HOST_ADDRESS,
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otpToken}. It will expire in 10 minutes.`,
    });

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    return { message: 'OTP sent to your email', userId: newUser._id, token, accessKey };
  }

  async verifyOtp({ email, otpToken }: { email: string; otpToken: string }) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Перевірка дійсності OTP
    if (!user.otpExpires || user.otpExpires < new Date()) {
      throw new Error('OTP has expired');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: 'base32',
      token: otpToken,
      window: 2,
    });

    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Оновлення статусу користувача
    user.isVerified = true;
    user.otpSecret = '';
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    return { message: 'Email verified successfully', token };
  }

  // Реалізація генерації refreshToken під час логіну
  async login({ identifier, password }: { identifier: string; password: string }) {
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      throw new Error('Invalid username/email or password');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email first');
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid username/email or password');
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(64).toString('hex');

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken, userId: user._id };
  }

  // Реалізація логіки оновлення токенів
  async refreshTokens(refreshToken: string) {
    const user = await this.userModel.findOne({ refreshToken });
    if (!user) {
      throw new Error('Invalid refresh token');
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const newRefreshToken = crypto.randomBytes(64).toString('hex');

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  async editUser(userId: string, updateProps: { username?: string; email?: string; password?: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProps.username) {
      user.username = updateProps.username;
    }
    if (updateProps.email) {
      user.email = updateProps.email;
    }

    await user.save();
    return { message: 'User updated successfully' };
  }

  async resendOtp(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpToken = speakeasy.totp({
      secret: user.otpSecret,
      encoding: 'base32',
    });

    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.transporter.sendMail({
      from: process.env.HOST_ADDRESS,
      to: user.email,
      subject: 'New OTP Verification',
      text: `Your new OTP is ${otpToken}. It will expire in 10 minutes.`,
    });

    return { message: 'New OTP sent to your email' };
  }

  async getUserById(userId: string): Promise<{ username: string; email: string; avatar: string | undefined; createdAt: Date }> {
    const user = await this.userModel.findById(userId).lean().exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    };
  }

  async getAccount(userId: string): Promise<IUser> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      notifications: user.notifications,
      accessKey: user.accessKey,
      googleAccessToken: user.googleAccessToken,
      googleRefreshToken: user.googleRefreshToken,
      googleTokenExpiryDate: user.googleTokenExpiryDate,
      isVerified: user.isVerified,
      password: user.password,
      otpSecret: user.otpSecret,
      otpExpires: user.otpExpires,
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
      throw new NotFoundException('User not found');
    }

    return { accessKey };
  }

  async deleteAccessKey(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $unset: { accessKey: 1 } },
      { new: true }
    );

    if (!user) throw new NotFoundException('User not found');
    return { message: 'Access key deleted successfully' };
  }

  async deleteGoogleTokens(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $unset: { googleAccessToken: 1, googleRefreshToken: 1, googleTokenExpiryDate: 1 } },
      { new: true }
    );

    if (!user) throw new NotFoundException('User not found');
    return { message: 'Google tokens deleted successfully' };
  }

  async getUserByIdForAuth(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async addNotification(userId: string, notification: { message: { title: string; startTime: Date; duration: number }; organizer: string }) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { notifications: notification } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}