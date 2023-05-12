import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, logLevel } from 'kafkajs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { INSTANCE_ID, SERVICE_NAME } from '../common/constants';

@Injectable()
export default class KafkaService extends Kafka {
  constructor(
    config: ConfigService,
    @InjectPinoLogger(KafkaService.name) logger: PinoLogger,
    @Inject(INSTANCE_ID) instanceId: string,
    @Inject(SERVICE_NAME) serviceName: string,
  ) {
    const kafkajsLogCreator =
      () =>
      ({
        namespace,
        label,
        log: logData,
      }: {
        namespace: string;
        label: string;
        log: { message: string };
      }): void => {
        const { message, ...extra } = logData;
        const data = {
          ...extra,
          namespace,
          original_label: label,
          original_message: message,
        };
        logger.trace(data, 'kafkajs_log');
      };

    super({
      clientId: `${serviceName}_${instanceId}`,
      brokers: config.getOrThrow('kafkaBrokers'),
      logLevel: logLevel.ERROR,
      logCreator: kafkajsLogCreator,
    });
  }
}
