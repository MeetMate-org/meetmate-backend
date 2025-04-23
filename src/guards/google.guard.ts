//google.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Отримуємо користувача з JWT

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.userId;

    // Отримуємо користувача з бази даних
    const dbUser = await this.userService.getUserByIdForAuth(userId);
    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    // Перевіряємо наявність хешованих токенів у базі
    if (!dbUser.googleAccessToken || !dbUser.googleRefreshToken) {
      throw new ForbiddenException('Google tokens are missing');
    }

    // Якщо токени є, пропускаємо запит
    return true;
  }
}