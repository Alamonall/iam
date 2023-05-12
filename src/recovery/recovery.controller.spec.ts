import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import AffirmationService from '../affirmation/affirmation.service';
import { ETCD } from '../common/constants';
import config from '../config';
import JwtService from '../jwt/jwt.service';
import KeycloakService from '../keycloak/keycloak.service';
import RecoveryController from './recovery.controller';
import RecoveryService from './recovery.service';

describe('RecoveryController', () => {
  let controller: RecoveryController;
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

  const mockEtcdloakService = {
    provide: ETCD,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [config] }),
        LoggerModule.forRoot(),
      ],
      providers: [
        RecoveryService,
        mockKeycloakService,
        mockAffirmationService,
        mockJwtService,
        mockEtcdloakService,
      ],
      controllers: [RecoveryController],
    }).compile();

    controller = module.get<RecoveryController>(RecoveryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
