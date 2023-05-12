import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import AppModule from '../src/app.module';
import AuthenticationModule from '../src/authentication/authentication.module';
import RecoveryModule from '../src/recovery/recovery.module';
import RegistrationModule from '../src/registration/registration.module';

// eslint-disable-next-line import/prefer-default-export
export const generate = async (path: string): Promise<void> => {
  const app = await NestFactory.create(AppModule);

  const appOption = new DocumentBuilder()
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

  writeFileSync(resolve(path), JSON.stringify(document), {
    encoding: 'utf8',
  });
  await app.close();
};
