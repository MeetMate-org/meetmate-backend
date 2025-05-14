//user.service.ts
import { Controller, Post, Body, Get, Param, UseGuards, Req, Delete, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Реєстрація нового користувача
  @Post('signup')
  @ApiResponse({ status: 201, description: 'OTP code sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    type: Object,
    examples: {
      example1: {
        summary: 'Example user',
        value: {
          username: 'string',
          email: "string",
          password: 'string',
        },
      },
    },
    description: 'User registration properties',
    required: true,
  })
  async signup(@Body() userProps: { username: string; email: string; password: string }) {
    return this.userService.register(userProps);
  }

  @Put("edit/:userId")
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({
    type: Object,
    examples: {
      example1: {
        summary: 'Example user update',
        value: {
          username: 'string',
          email: "string",
          password: 'string',
        },
      },
    },
    description: 'User update properties',
    required: true,
  })
  @UseGuards(JwtAuthGuard)
  async editUser(
    @Param("userId") userId: string,
    @Body() userProps: { username: string; email: string; password: string },
  ) {
    return this.userService.editUser(userId, userProps);
  }

  @Post('verify-otp')
  @ApiResponse({ status: 200, description: 'OTP verified' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    type: Object,
    examples: {
      example1: {
        summary: 'Example OTP verification',
        value: {
          email: 'string',
          otpToken: 'string',
        },
      },
    },
    description: 'OTP verification properties',
    required: true,
  })
  async verifyOtp(
    @Body()
    verifyProps: { email: string; otpToken: string; },
  ) {
    return this.userService.verifyOtp(verifyProps);
  }

  @Post('resend-otp/:userId')
  @ApiResponse({ status: 200, description: 'OTP resent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({
    type: Object,
    examples: {
      example1: {
        summary: 'Example OTP resend',
        value: {
          userId: 'string',
        },
      },
    },
    description: 'OTP resend properties',
    required: true,
  })
  async resendOtp(@Param("userId") userId: string) {
    return this.userService.resendOtp(userId);
  }

  // Авторизація користувача
  @Post('login')
  @ApiResponse({ status: 200, description: 'User logged in' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    type: Object,
    examples: {
      example1: {
        summary: 'Example user login',
        value: {
          identifier: 'string',
          password: 'string',
        },
      },
    },
    description: 'User login properties',
    required: true,
  })
  async login(@Body() userProps: { identifier: string; password: string }) {
    return this.userService.login(userProps);
  }

      // Додати новий ендпоінт для оновлення токенів
      @Post('refresh-tokens')
      @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
      @ApiResponse({ status: 400, description: 'Bad request' })
      async refreshTokens(@Body() body: { refreshToken: string }) {
          return this.userService.refreshTokens(body.refreshToken);
      }

  // Отримання інформації про користувача за ID
  @Get(':id')
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    type: Object,
    examples: {
      example1: {
        summary: 'Example user ID',
        value: {
          id: 'string',
        },
      },
    },
    description: 'User ID properties',
    required: true,
  })
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Get("account/:userId")
  @ApiResponse({ status: 200, description: 'User account found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    type: Object,
    examples: {
      example1: {
        summary: 'Example user account',
        value: {
          id: 'string',
        },
      },
    },
    description: 'User account properties',
    required: true,
  })
  @UseGuards(JwtAuthGuard)
  async getUserAccount(@Param("userId") userId: string) {    
    return this.userService.getAccount(userId);
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