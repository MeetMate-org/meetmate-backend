//access-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class AccessKeyGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessKey = request.body?.accessKey;

    if (!accessKey) {
      throw new ForbiddenException('AccessKey is required');
    }

    const userId = await this.userService.getUserIdByAccessKey(accessKey);
    if (!userId) {
      throw new ForbiddenException('Invalid AccessKey');
    }

    request.body.userId = userId; // Додаємо userId до запиту
    return true;
  }
}