//main.ts
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { NoSQLInjectionMiddleware } from './middlewares/nosql-injection.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Завантаження .env файлів для різних середовищ
  if (process.env.NODE_ENV !== 'production') {
    const envPath = path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`);
    require('dotenv').config({ path: envPath });
  }

  // Налаштування Swagger-документації
  const config = new DocumentBuilder()
    .setTitle('MeetMate API')
    .setDescription('MeetMate API documentation')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-access-token', in: 'header' },
      'x-access-token'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Підключення body-parser для парсингу JSON
  app.use(bodyParser.json());

  // Захист від XSS і Clickjacking
  app.use(helmet());

  // Інтеграція middleware для захисту від NoSQL injection
  app.use(new NoSQLInjectionMiddleware().use.bind(new NoSQLInjectionMiddleware()));

  // Глобальна валідація
  app.useGlobalPipes(new ValidationPipe());

  // Налаштування CORS
  app.enableCors({
    origin: [process.env.URL_FRONTEND],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Запуск серверу
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();