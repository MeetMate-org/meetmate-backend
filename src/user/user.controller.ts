import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
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
}
