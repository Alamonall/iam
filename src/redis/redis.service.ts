import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export default class RedisService
  extends Redis
  implements OnApplicationShutdown
{
  constructor(
    configService: ConfigService,
    @InjectPinoLogger(RedisService.name) private readonly logger: PinoLogger,
  ) {
    const uri = configService.getOrThrow('redisUri');
    const env = configService.get('environment');
    super(uri, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: env === 'local',
    });
    this.setMaxListeners(100);
    this.logger.info({ msg: 'redis_init', env, uri });
  }

  onApplicationShutdown(signal?: string): void {
    this.disconnect();
    this.logger.info({ msg: 'SIGINT', signal });
  }
}
