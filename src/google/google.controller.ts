//google.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { GoogleAuthService } from './google-auth.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string };
  query: { code: string; state: string };
}

@Controller('google')
export class GoogleController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('auth/url')
  @UseGuards(JwtAuthGuard)
  async getAuthUrl(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.googleAuthService.generateAuthUrl(userId);
  }

  @Get('auth/callback')
  async handleAuthCallback(@Req() req: RequestWithUser) {
    const { code, state } = req.query;
    return this.googleAuthService.handleAuthCallback(state as string, code as string);
  }
}