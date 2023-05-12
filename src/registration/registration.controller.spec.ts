import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import RegistrationController from './registration.controller';
import RegistrationService from './registration.service';
import JwtService from '../jwt/jwt.service';
import AffirmationService from '../affirmation/affirmation.service';
import KeycloakService from '../keycloak/keycloak.service';
import RecoveryService from '../recovery/recovery.service';
import CommonModule from '../common/common.module';
import EventTransporterService from '../event-transporter/event-transporter.service';
import config from '../config';

describe('RegistrationController', () => {
  let controller: RegistrationController;

  beforeEach(async () => {
    const mockAffirmationService = {
      provide: AffirmationService,
      useFactory: () => ({
        getGpa: jest.fn(() => 4.5),
      }),
    };
    const mockJwtService = {
      provide: JwtService,
      useFactory: () => ({
        getGpa: jest.fn(() => 4.5),
      }),
    };
    const mockKeycloakService = {
      provide: KeycloakService,
      useFactory: () => ({
        getGpa: jest.fn(() => 4.5),
      }),
    };

    const mockEventTransporterService = {
      provide: EventTransporterService,
      useFactory: () => ({
        getGpa: jest.fn(() => 4.5),
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot(),
        CommonModule,
        ConfigModule.forRoot({
          load: [config],
        }),
      ],
      controllers: [RegistrationController],
      providers: [
        RegistrationService,
        mockJwtService,
        mockAffirmationService,
        mockKeycloakService,
        RecoveryService,
        mockEventTransporterService,
      ],
    }).compile();

    controller = module.get<RegistrationController>(RegistrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
