import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import CommonModule from '../common/common.module';
import config from '../config';
import VaultService from '../vault/vault.service';
import JwtService from './jwt.service';

describe('JwtService', () => {
  let service: JwtService;
  const mockVaultService = {
    provide: VaultService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CommonModule,
        ConfigModule.forRoot({ load: [config] }),
        LoggerModule.forRoot(),
      ],
      providers: [JwtService, mockVaultService],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
