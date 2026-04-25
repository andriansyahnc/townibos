import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const config = app.get(ConfigService);
  const port = config.get<number>('port');

  await app.listen(port);
  console.log(`Townibos running on port ${port}`);
}

bootstrap();
