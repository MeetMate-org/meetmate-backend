//jwt.auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { BaseJwtAuthGuard } from './base-jwt-auth.guard';

@Injectable()
export class JwtAuthGuard extends BaseJwtAuthGuard {
  extractRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}