import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-access-token'];

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
