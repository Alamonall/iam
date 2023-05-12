import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import * as http from 'http';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import AppModule from './app.module';
import RegistrationModule from './registration/registration.module';
import JwtService from './jwt/jwt.service';
import serviceRouterApp from './ServiceRouterApp';
import EventTransporterService from './event-transporter/event-transporter.service';
import KeycloakService from './keycloak/keycloak.service';
import AuthenticationModule from './authentication/authentication.module';
import RecoveryModule from './recovery/recovery.module';
import HttpExceptionFilter from './filters/HttpExceptionFilter';
import ErrorFilter from './filters/ErrorFilter';
import AffirmationService from './affirmation/affirmation.service';
import { FailureCode } from './filters/FailureCode';
import HealthReporterService from './health-reporter/health-reporter.service';
import DefaultErrorFilter from './filters/DefaultErrorFilter';
import DefaultError from './filters/DefaultError';

async function bootstrap() {
  const externalExpressInstance = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(externalExpressInstance),
    { bufferLogs: true },
  );
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  const affirmationService = app.get<AffirmationService>(AffirmationService);
  const jwtClient = app.get<JwtService>(JwtService);
  const eventTransporterService = app.get<EventTransporterService>(
    EventTransporterService,
  );
  const keycloakService = app.get<KeycloakService>(KeycloakService);
  const healthReporter = app.get<HealthReporterService>(HealthReporterService);
  const appOption = new DocumentBuilder()
    .addSecurity('x-realm-name', { type: 'apiKey' })
    .setTitle('IAM')
    .setDescription('The IAM Service description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, appOption, {
    include: [
      AppModule,
      RegistrationModule,
      AuthenticationModule,
      RecoveryModule,
    ],
  });

  SwaggerModule.setup('api', app, document);

  app.useLogger(logger);
  app.useGlobalFilters(
    new ErrorFilter(logger),
    new HttpExceptionFilter(logger),
    new DefaultErrorFilter(logger),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: Array<ValidationError>) => {
        throw new DefaultError({
          code: FailureCode.BAD_REQUEST,
          status: 400,
          message: 'validation_error',
          source: 'class-validator',
          additional: errors.map(({ constraints, value, property }) => {
            return {
              constraints,
              value,
              property,
            };
          }),
        });
      },
    }),
  );

  await app.init();
  await healthReporter.start();
  await jwtClient.init();
  eventTransporterService.installJobsAndWorkers();
  await eventTransporterService.start();
  await keycloakService.init();
  await affirmationService.init();
  app.enableShutdownHooks();
  http
    .createServer(externalExpressInstance)
    .listen(config.getOrThrow<number>('apiPort'));
  serviceRouterApp(document);
}
bootstrap();
