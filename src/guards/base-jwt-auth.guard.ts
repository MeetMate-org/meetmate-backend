//base-jwt-auth.guard.ts
import { UnauthorizedException, Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class BaseJwtAuthGuard implements CanActivate {
  extractRequest(context: ExecutionContext): any {
    // Для REST: Request
    return context.switchToHttp().getRequest();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = this.extractRequest(context);
    const token = request.headers['x-access-token'];

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in env');
      }

      const decoded = jwt.verify(token, jwtSecret);
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}