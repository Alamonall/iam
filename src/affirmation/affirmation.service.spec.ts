import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import config from '../config';
import CommonModule from '../common/common.module';
import AffirmationService from './affirmation.service';
import RedisService from '../redis/redis.service';
import EventTransporterService from '../event-transporter/event-transporter.service';
import KafkaService from '../kafka/kafka.service';
import VaultService from '../vault/vault.service';

describe('AffirmationService', () => {
  let service: AffirmationService;
  const mockRedisService = {
    provide: RedisService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
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
        CommonModule,
      ],
      providers: [
        AffirmationService,
        mockRedisService,
        mockVaultService,
        EventTransporterService,
        KafkaService,
      ],
    }).compile();

    service = module.get<AffirmationService>(AffirmationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
