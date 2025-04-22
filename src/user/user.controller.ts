//user.service.ts
import { Controller, Post, Body, Get, Param, UseGuards, Req, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Реєстрація нового користувача
  @Post('signup')
  async signup(@Body() userProps: { username: string; email: string; password: string }) {
    return this.userService.signup(userProps);
  }

  // Авторизація користувача
  @Post('login')
  async login(@Body() userProps: { identifier: string; password: string }) {
    return this.userService.login(userProps);
  }

  // Отримання інформації про користувача за ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  // Генерація нового `accessKey`
  @Post('generate-access-key')
  @UseGuards(JwtAuthGuard)
  async generateAccessKey(@Req() req) {
    const userId = req.user.userId;
    return this.userService.generateAccessKey(userId);
  }

  // Скидання `accessKey`
  @Delete('delete-access-key')
  @UseGuards(JwtAuthGuard)
  async deleteAccessKey(@Req() req) {
    const userId = req.user.userId;
    return this.userService.deleteAccessKey(userId);
  }

  // Видалення Google токенів
  @Delete('delete-google-tokens')
  @UseGuards(JwtAuthGuard)
  async deleteGoogleTokens(@Req() req) {
    const userId = req.user.userId;
    return this.userService.deleteGoogleTokens(userId);
  }
}