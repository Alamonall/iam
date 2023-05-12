import { Module } from '@nestjs/common';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  SpecRouterOptions,
  SpecRouterModule,
} from '@acme/nestjs-spec-http-api-router';
import Spec from '@acme/spec-and-validate';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import CommonModule from '../common/common.module';
import {
  INSTANCE_ID,
  SERVICE_NAME,
  SERVICE_VERSION,
} from '../common/constants';
import ServiceRouterService from './service-router.service';
import ServiceRouterController from './service-router.controller';
import configFile from '../config';

@Module({
  imports: [
    SpecRouterModule.forRootFactory({
      useFactory: (spec, serviceName, serviceVersion, instanceId, logger) => {
        return new SpecRouterOptions({
          spec,
          serviceName,
          serviceVersion,
          instanceId,
          logger,
        });
      },
      inject: [Spec, SERVICE_NAME, SERVICE_VERSION, INSTANCE_ID, PinoLogger],
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: false },
    }),
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configFile],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService, INSTANCE_ID, SERVICE_NAME, SERVICE_VERSION],
      imports: [ConfigModule],
      useFactory: async (
        config: ConfigService,
        instanceId: string,
        serviceName: string,
        serviceVersion: string,
      ) => ({
        pinoHttp: {
          mixin: () => ({
            version: serviceVersion,
            service: serviceName,
            instance: instanceId,
          }),
          level: config.getOrThrow<string>('logLevel'),
        },
      }),
    }),
  ],
  controllers: [ServiceRouterController],
  providers: [ServiceRouterService],
})
export default class ServiceRouterModule {}
