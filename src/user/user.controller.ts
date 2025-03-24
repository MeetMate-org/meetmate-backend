import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './jwt.auth.guard';

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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }
}
