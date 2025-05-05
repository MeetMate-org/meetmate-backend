//main.ts
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Налаштування Swagger
  const config = new DocumentBuilder()
    .setTitle('MeetMate API')
    .setDescription('MeetMate API documentation')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-access-token', in: 'header' }, // Використовуємо x-access-token
      'x-access-token'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const envPath = path.resolve(
    __dirname,
    `../.env.${process.env.NODE_ENV || 'development'}`
  );
  require('dotenv').config({ path: envPath });


  app.enableCors({
    // enable CORS for URL_DEV, URL_PROD
    origin: [
      process.env.URL_DEV,
      process.env.URL_PROD,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();