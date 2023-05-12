import Spec from "@acme/spec-and-validate";
import { BeforeApplicationShutdown, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import {
  BULL_QUEUES,
  INSTANCE_ID,
  SERVICE_NAME,
  SERVICE_VERSION,
} from "../common/constants";
import KafkaService from "../kafka/kafka.service";
import RedisService from "../redis/redis.service";

@Injectable()
export default class EventTransporterService
  implements BeforeApplicationShutdown
{
  constructor(
    config: ConfigService,
    @Inject(INSTANCE_ID) instanceId: string,
    @Inject(SERVICE_NAME) serviceName: string,
    @Inject(SERVICE_VERSION) serviceVersion: string,
    @Inject(Spec) spec: Spec,
    kafkaService: KafkaService,
    redisService: RedisService,
    @Inject(BULL_QUEUES) queues: Record<string, Queue>,
    @InjectPinoLogger(EventTransporterService.name)
    private readonly logger: PinoLogger
  ) {
    super({
      instanceId,
      redis: redisService,
      kafka: kafkaService,
      log: logger,
      serviceName,
      serviceVersion,
      spec,
      bullQueues: queues,
      topicNamespace: config.getOrThrow("kafkaTopicNamespace"),
    });
  }

  async beforeApplicationShutdown(signal?: string) {
    await this.stop();
    this.logger.info({ msg: "SIGINT", signal });
  }
}
