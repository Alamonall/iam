import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import RedisService from '../redis/redis.service';
import KafkaService from '../kafka/kafka.service';
import config from '../config';
import EventTransporterService from './event-transporter.service';
import CommonModule from '../common/common.module';

describe('EventTransporterService', () => {
  let eventTransporterService: EventTransporterService;
  const mockRedisService = {
    provide: RedisService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CommonModule,
        ConfigModule.forRoot({
          load: [config],
        }),
        LoggerModule.forRoot(),
      ],
      providers: [EventTransporterService, KafkaService, mockRedisService],
    }).compile();

    eventTransporterService = module.get<EventTransporterService>(
      EventTransporterService,
    );
  });

  it('should be defined', () => {
    expect(eventTransporterService).toBeDefined();
  });
});
