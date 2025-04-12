import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('MeetMate API')
    .setDescription('MeetMate API docs')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-access-token', in: 'header' },
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
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
