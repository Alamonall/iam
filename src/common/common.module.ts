import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Queue } from "bullmq";
import { version } from "../../package.json";
import {
  BULL_QUEUES,
  INSTANCE_ID,
  SERVICE_NAME,
  SERVICE_VERSION,
  SPEC_VERSION,
} from "./constants";
import { EtcdProvider } from "./etcd.provider";

const bullQueues: Record<string, Queue> = {};

@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    {
      provide: INSTANCE_ID,
      useValue: newId("inst"),
    },
    {
      provide: SERVICE_VERSION,
      useValue: version,
    },
    {
      provide: SERVICE_NAME,
      useValue: "iam",
    },
    {
      provide: SPEC_VERSION,
      useValue: spec.version,
    },
    {
      provide: Spec,
      useValue: spec,
    },
    {
      provide: BULL_QUEUES,
      useValue: bullQueues,
    },
    EtcdProvider,
  ],
  exports: [
    INSTANCE_ID,
    SERVICE_VERSION,
    SERVICE_NAME,
    SPEC_VERSION,
    Spec,
    BULL_QUEUES,
    EtcdProvider.provide,
  ],
})
export default class CommonModule {}
