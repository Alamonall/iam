import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { INSTANCE_ID, SERVICE_NAME } from "../common/constants";

@Injectable()
export default class HealthReporterService implements OnApplicationShutdown {
  healthReporter: HealthReporter;

  constructor(
    private readonly config: ConfigService,
    @InjectPinoLogger(HealthReporterService.name)
    private readonly logger: PinoLogger,
    @Inject(SERVICE_NAME) private readonly serviceName: string,
    @Inject(INSTANCE_ID) private readonly instanceId: string
  ) {
    const log = serviceLogger({
      instanceId: this.instanceId,
      serviceName: this.serviceName,
      level: this.config.getOrThrow("logLevel"),
      pretty: process.env.NODE_ENV !== "production",
    });

    this.healthReporter = new HealthReporter({
      logger: log,
      intervalMs: 60 * 1000,
      environment: this.config.getOrThrow("environment"),
    });
  }

  async onApplicationShutdown(signal?: string) {
    await this.healthReporter.stop();
    this.logger.info({ msg: "health_reporter_shutdown" });
  }

  async start(): Promise<void> {
    await this.healthReporter.start();
  }

  async stop(): Promise<void> {
    await this.healthReporter.stop();
  }
}
