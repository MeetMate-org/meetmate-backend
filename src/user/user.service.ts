import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as crypto from 'crypto';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import * as speakeasy from 'speakeasy';

@Injectable()
export class UserService {
  private transporter: nodemailer.Transporter;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.HOST_ADDRESS,
        pass: process.env.HOST_PASSWORD,
      },
    });
  }

  async register(userProps: { username: string; email: string; password: string }) {
    const { username, email, password } = userProps;
    const existingEmail = await this.userModel.findOne({ email });
    if (existingEmail) {
      throw new Error('A user with this email address already exists.');
    }

    const existingUsername = await this.userModel.findOne({ username });
    if (existingUsername) {
      throw new Error('A user with that name already exists.');
    }

    const otpSecret = speakeasy.generateSecret({ length: 20 });
    const otpToken = speakeasy.totp({
      secret: otpSecret.base32,
      encoding: 'base32',
    });

    // Створюємо користувача в базі даних
    const hashedPassword = await bcryptjs.hash(password, 10);
    const accessKey = crypto.randomBytes(32).toString('hex');

    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      otpSecret: otpSecret.base32,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // OTP дійсний 10 хв
      isVerified: false,
      accessKey,
    });

    await newUser.save();

    // Відправлення OTP на email
    const mailOptions = {
      from: process.env.HOST_ADDRESS,
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otpToken}. It will expire in 10 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET!, { expiresIn: '48h' });

    return { message: 'OTP sent to your email', userId: newUser._id, token, accessKey };
  }

  async verifyOtp(verifyProps: { email: string; otpToken: string }) {
    const { email, otpToken } = verifyProps;

    // Знаходимо користувача за email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Перевіряємо, чи OTP не закінчився
    if (!user.otpExpires || user.otpExpires < new Date()) {
      throw new Error('OTP has expired');
    }

    // Верифікуємо OTP
    const isValid = speakeasy.totp.verify({
      secret: user.otpSecret, // Беремо секрет із бази даних
      encoding: 'base32',
      token: otpToken,
      window: 2,
    });

    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Позначаємо користувача як верифікованого
    user.isVerified = true;
    user.otpSecret = ''; // Очищаємо секрет
    user.otpExpires = undefined; // Очищаємо час дії OTP
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    return { message: 'Email verified successfully', token };
  }

  async login(userProps: { identifier: string; password: string }) {
    const { identifier, password } = userProps;
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '48h' });
    return { token, userId: user._id };
  }

  async resendOtp(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const otpToken = speakeasy.totp({
      secret: user.otpSecret,
      encoding: 'base32',
    });

    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const mailOptions = {
      from: process.env.HOST_ADDRESS,
      to: user.email,
      subject: 'New OTP Verification',
      text: `Your new OTP is ${otpToken}. It will expire in 10 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);

    return { message: 'New OTP sent to your email' };
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

    return { accessKey };
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