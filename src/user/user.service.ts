import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(userProps: { username: string; email: string; password: string }) {
    const { username, email, password } = userProps;
    const existingEmail = await this.userModel.findOne({ email });
    if (existingEmail) {
      throw new Error('Користувач із цією електронною адресою вже існує');
    }

    const existingUsername = await this.userModel.findOne({ username });
    if (existingUsername) {
      throw new Error('Користувач із таким іменем вже існує');
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new this.userModel({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token, userId: user._id };
  }

  async login(userProps: { identifier: string; password: string }) {
    const { identifier, password } = userProps;
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      throw new Error('Недійсне ім’я користувача/email або пароль');
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Недійсне ім’я користувача/email або пароль');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token, userId: user._id };
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('Користувача не знайдено');
    }
    return {
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }
}
