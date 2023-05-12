import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as http from 'http';
import * as express from 'express';
import { Logger } from 'nestjs-pino';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import ServiceRouterModule from './service-router/service-router.module';

async function serviceRouterApp(openAPIScheme: OpenAPIObject) {
  const serviceRouterInstance = express();
  const app = await NestFactory.create(
    ServiceRouterModule,
    new ExpressAdapter(serviceRouterInstance),
    { bufferLogs: true },
  );
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  SwaggerModule.setup('api', app, openAPIScheme);
  await app.init();

  http
    .createServer(serviceRouterInstance)
    .listen(config.getOrThrow<number>('port'));
}

export default serviceRouterApp;
