//nosql-injection.middleware.ts
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';

@Injectable()
export class NoSQLInjectionMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    try {
      console.log('Sanitizing request...');
      console.log('URL:', req.url);
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      console.log('Query:', req.query);
      console.log('Params:', req.params);

      // Перевіряємо URL
      this.sanitizeURL(req.url);

      // Перевіряємо тіло запиту
      if (req.body) {
        this.sanitize(req.body);
      }

      // Перевіряємо query-параметри
      if (req.query) {
        this.sanitize(req.query);
      }

      // Перевіряємо параметри запиту
      if (req.params) {
        this.sanitize(req.params);
      }

      // Перевіряємо заголовки запиту
      if (req.headers) {
        const sanitizedHeaders = this.parseHeaders(req.headers);
        this.sanitize(sanitizedHeaders);
      }

      next();
    } catch (error) {
      console.error('Blocked request due to NoSQL injection attempt:', error.message);
      throw new BadRequestException(error.message);
    }
  }

  private sanitizeURL(url: string) {
    const forbiddenKeys = ['$gt', '$lt', '$gte', '$lte', '$ne', '$or', '$and', '$regex'];
    for (const key of forbiddenKeys) {
      if (url.includes(key)) {
        console.log(`Blocked key in URL: ${key}`);
        throw new Error(`NoSQL Injection attempt detected in URL: "${key}" is not allowed.`);
      }
    }
  }

  private sanitize(obj: any) {
    const forbiddenKeys = ['$gt', '$lt', '$gte', '$lte', '$ne', '$or', '$and', '$regex'];

    for (const key in obj) {
      if (forbiddenKeys.includes(key)) {
        console.log(`Blocked key: ${key}`); // Лог для налагодження
        throw new Error(`NoSQL Injection attempt detected: "${key}" is not allowed.`);
      }

      if (typeof obj[key] === 'object') {
        this.sanitize(obj[key]); // Рекурсивно перевіряємо вкладені об'єкти
      }
    }
  }

  private parseHeaders(headers: Record<string, string>): Record<string, any> {
    const parsedHeaders: Record<string, any> = {};
    for (const [key, value] of Object.entries(headers)) {
      try {
        parsedHeaders[key] = JSON.parse(value); // Перетворення JSON-рядків на об’єкти
      } catch {
        parsedHeaders[key] = value; // Якщо це не JSON, залишаємо як є
      }
    }
    return parsedHeaders;
  }
}