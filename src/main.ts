import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export function buildSwaggerDocument(app: any) {
  const config = new DocumentBuilder()
    .setTitle('Townibos API')
    .setDescription('Residential complex (perumahan) CRM — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  app.enableCors();

  if (process.env.NODE_ENV !== 'production') {
    const document = buildSwaggerDocument(app);
    SwaggerModule.setup('api/docs', app, document);
  }

  const config = app.get(ConfigService);
  const port = config.get<number>('port');

  await app.listen(port);
  console.log(`Townibos running on port ${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger UI: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
