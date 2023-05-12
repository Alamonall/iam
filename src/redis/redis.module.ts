import { Module } from '@nestjs/common';
import RedisService from './redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export default class RedisModule {}
