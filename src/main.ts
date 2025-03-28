import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const envPath = path.resolve(
    __dirname,
    `../.env.${process.env.NODE_ENV || 'development'}`
  );
  require('dotenv').config({ path: envPath });
  
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
