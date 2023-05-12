import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import config from '../config';
import VaultService from '../vault/vault.service';
import KeycloakService from './keycloak.service';

describe('KeycloakService', () => {
  let service: KeycloakService;
  const mockVaultService = {
    provide: VaultService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot(),
        ConfigModule.forRoot({ load: [config] }),
      ],
      providers: [KeycloakService, mockVaultService],
    }).compile();

    service = module.get<KeycloakService>(KeycloakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
