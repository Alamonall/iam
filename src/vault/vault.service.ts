import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export default class VaultService extends VaultKeyValue {
  constructor(config: ConfigService, private readonly logger: PinoLogger) {
    super({
      endpointToEngine: config.getOrThrow("vaultEndpointToKv"),
      token: config.getOrThrow("vaultToken"),
    });
    this.logger.setContext(VaultService.name);
    this.logger.info({
      msg: "vault init",
      endpoint: config.getOrThrow("vaultEndpointToKv"),
    });
  }
}
