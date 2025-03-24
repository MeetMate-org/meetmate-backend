import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserService } from './user.service';

@Injectable()
export class JwtAuthGuard {
  constructor(private readonly userService: UserService) {}

  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-access-token'];

    if (!token) {
      throw new UnauthorizedException('Токен не надано');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Невірний або прострочений токен');
    }
  }
}
