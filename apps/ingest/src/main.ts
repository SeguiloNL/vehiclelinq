import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConfig } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  await app.listen(getConfig().healthPort, '0.0.0.0');
}

void bootstrap();
