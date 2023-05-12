import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  SpecRouterModule,
  SpecRouterOptions,
} from '@acme/nestjs-spec-http-api-router';
import Spec from '@acme/spec-and-validate';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import ServiceRouterService from './service-router.service';
import ServiceRouterController from './service-router.controller';
import config from '../config';
import CommonModule from '../common/common.module';
import {
  INSTANCE_ID,
  SERVICE_NAME,
  SERVICE_VERSION,
} from '../common/constants';

describe('ServiceRouterController', () => {
  let controller: ServiceRouterController;
  const queueMock = {
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
  };
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        CommonModule,
        LoggerModule.forRoot(),
        ConfigModule.forRoot({ load: [config] }),
        SpecRouterModule.forRootFactory({
          useFactory: (
            spec,
            serviceName,
            serviceVersion,
            instanceId,
            logger,
          ) => {
            return new SpecRouterOptions({
              spec,
              serviceName,
              serviceVersion,
              instanceId,
              logger,
            });
          },
          inject: [
            Spec,
            SERVICE_NAME,
            SERVICE_VERSION,
            INSTANCE_ID,
            PinoLogger,
          ],
        }),
      ],
      controllers: [ServiceRouterController],
      providers: [
        ServiceRouterService,
        {
          provide: 'BullQueue_notifications',
          useValue: queueMock,
        },
      ],
    }).compile();

    controller = module.get<ServiceRouterController>(ServiceRouterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
