import { Module } from '@nestjs/common';
import CommonModule from '../common/common.module';
import KafkaModule from '../kafka/kafka.module';
import RedisModule from '../redis/redis.module';
import EventTransporterService from './event-transporter.service';

@Module({
  imports: [KafkaModule, CommonModule, RedisModule],
  providers: [EventTransporterService],
  exports: [EventTransporterService],
})
export default class EventTransporterModule {}
