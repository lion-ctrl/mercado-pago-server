import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PORT } from './config/constants';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const port = config.get<string>(PORT) || 4000;

  app.enableCors();
  await app.listen(port);
  logger.log(`Server on Port ${await app.getUrl()}`);
}
bootstrap();
