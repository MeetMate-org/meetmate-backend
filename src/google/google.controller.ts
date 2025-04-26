//google.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { GoogleAuthService } from './google-auth.service';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery, ApiResponse } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: { userId: string };
  query: { code: string; state: string };
}

@ApiTags('Google') // Групуємо ендпоінти в групі "Google" у Swagger
@Controller('google')
export class GoogleController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('auth/url')
  @ApiHeader({
    name: 'x-access-token',
    description: 'JWT token for authentication',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiOperation({
    summary: 'Get Google Auth URL',
    description: 'Generate a URL for Google OAuth2 authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated Google Auth URL.',
    schema: {
      example: {
        url: 'https://accounts.google.com/o/oauth2/auth?client_id=...',
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  async getAuthUrl(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.googleAuthService.generateAuthUrl(userId);
  }

  @Get('auth/callback')
  @ApiOperation({
    summary: 'Handle Google Auth Callback',
    description: 'Handle the OAuth2 callback from Google and process the tokens.',
  })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code returned by Google',
    required: true,
    example: '4/0ARtbsJ...',
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter to identify the user',
    required: true,
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed Google Auth callback.',
    schema: {
      example: {
        message: 'Google authorization successful',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., missing code or state).',
  })
  async handleAuthCallback(@Req() req: RequestWithUser) {
    const { code, state } = req.query;
    return this.googleAuthService.handleAuthCallback(state as string, code as string);
  }
}