import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import KafkaService from './kafka.service';
import config from '../config';
import CommonModule from '../common/common.module';

describe('KafkaService', () => {
  let service: KafkaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CommonModule,
        ConfigModule.forRoot({ load: [config] }),
        LoggerModule.forRoot(),
      ],
      providers: [KafkaService],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
