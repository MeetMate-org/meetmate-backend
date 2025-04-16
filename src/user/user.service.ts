import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
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
    const newUser = new this.userModel({
      username,
      email,
      password: await bcryptjs.hash(password, 10), // Хешуємо пароль
      otpSecret: otpSecret.base32,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // OTP дійсний 10 хв
      isVerified: false,
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
  
    return { message: 'OTP sent to your email', userId: newUser._id };
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

    // generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
  
    return { message: 'Email verified successfully', token: token };
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

    const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
    return { token, userId: user._id };
  }

  async resendOtp(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const otpToken = speakeasy.totp({
      secret: user.otpSecret,
      encoding: 'base32'
    });

    user.otpExpires = new Date(Date.now() + 10*60*1000);
    await user.save();

    const mailOptions = {
      from: process.env.HOST_ADDRESS,
      to: user.email,
      subject: 'New OTP Verification',
      text: `Your new OTP is ${otpToken}. It will expire in 10 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);

    // generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });

    return { message: 'New OTP sent to your email', token: token };
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
}