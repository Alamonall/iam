import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { LoggerModule } from "nestjs-pino";
import AppController from "./app.controller";
import AppService from "./app.service";
import AuthenticationModule from "./authentication/authentication.module";
import CommonModule from "./common/common.module";
import { INSTANCE_ID, SERVICE_NAME, SERVICE_VERSION } from "./common/constants";
import config from "./config";
import EventTransporterService from "./event-transporter/event-transporter.service";
import HealthReporterModule from "./health-reporter/health-reporter.module";
import KafkaModule from "./kafka/kafka.module";
import KeycloakService from "./keycloak/keycloak.service";
import RedisModule from "./redis/redis.module";
import RegistrationModule from "./registration/registration.module";
import ServiceRouterModule from "./service-router/service-router.module";
import VaultModule from "./vault/vault.module";

@Module({
  controllers: [AppController],
  providers: [AppService, EventTransporterService, KeycloakService],
  exports: [KeycloakService],
  imports: [
    HealthReporterModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.getOrThrow("rateLimiterTtl"),
        limit: configService.getOrThrow("rateLimiterLimit"),
      }),
    }),
    VaultModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    PrometheusModule.register({
      path: "/metrics",
      defaultMetrics: { enabled: false },
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService, INSTANCE_ID, SERVICE_VERSION, SERVICE_NAME],
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
        instanceId: string,
        serviceVersion: string,
        serviceName: string
      ) => ({
        pinoHttp: {
          mixin: () => ({
            version: serviceVersion,
            service: serviceName,
            instance: instanceId,
          }),
          level: configService.get("logLevel"),
        },
      }),
    }),
    KafkaModule,
    RedisModule,
    ServiceRouterModule,
    RegistrationModule,
    CommonModule,
    AuthenticationModule,
  ],
})
export default class AppModule {}
