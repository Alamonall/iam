import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import AffirmationService from '../affirmation/affirmation.service';
import CommonModule from '../common/common.module';
import config from '../config';
import EventTransporterService from '../event-transporter/event-transporter.service';
import JwtService from '../jwt/jwt.service';
import KeycloakService from '../keycloak/keycloak.service';
import RegistrationService from './registration.service';

describe('RegistrationService', () => {
  let service: RegistrationService;

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
      providers: [
        RegistrationService,
        mockJwtService,
        mockAffirmationService,
        mockKeycloakService,
        mockEventTransporterService,
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
