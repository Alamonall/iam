import { Module } from '@nestjs/common';
import EventTransporterModule from '../event-transporter/event-transporter.module';
import RedisModule from '../redis/redis.module';
import VaultModule from '../vault/vault.module';
import AffirmationService from './affirmation.service';

@Module({
  imports: [RedisModule, EventTransporterModule, VaultModule],
  providers: [AffirmationService],
  exports: [AffirmationService],
})
export default class AffirmationModule {}
