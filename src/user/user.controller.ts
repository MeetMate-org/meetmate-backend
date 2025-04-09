import { Controller, Post, Body, Get, Param, UseGuards, Req, Delete, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { SaveGoogleTokensDto } from './dto/google.token.dto';

interface RequestWithUser extends Request {
  user: { userId: string };
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(@Body() userProps: { username: string; email: string; password: string }) {
    return this.userService.signup(userProps);
  }

  @Post('login')
  async login(@Body() userProps: { identifier: string; password: string }) {
    return this.userService.login(userProps);
  }

  @Post('generate-access-key')
  @UseGuards(JwtAuthGuard)
  async generateAccessKey(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    console.log(userId);
    return this.userService.generateAccessKey(userId);
  }

  @Post('private-info')
  @UseGuards(JwtAuthGuard)
  async getPrivateUserData(@Body() body: { userId: string; accessKey: string }) {
    const { userId, accessKey } = body;
    return this.userService.getUserByAccessKey(userId, accessKey);
  }

  @Delete('delete-access-key')
  @UseGuards(JwtAuthGuard)
  async deleteAccessKey(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.userService.deleteAccessKey(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Post('save-google-tokens')
  async saveGoogleTokens(@Body() dto: SaveGoogleTokensDto) {
    return this.userService.saveGoogleTokens(dto);
  }
}
