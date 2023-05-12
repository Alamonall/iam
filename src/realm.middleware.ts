import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Namespace } from 'etcd3';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ETCD } from './common/constants';
import DefaultError from './filters/DefaultError';
import { FailureCode } from './filters/FailureCode';
import VaultService from './vault/vault.service';

@Injectable()
export default class RealmMiddleware implements NestMiddleware {
  constructor(
    @InjectPinoLogger(RealmMiddleware.name) private readonly logger: PinoLogger,
    private readonly vault: VaultService,
    @Inject(ETCD)
    private readonly etcd: Namespace,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async use(req: any, res: any, next: () => void) {
    const realmName = req.headers['x-realm-name'];
    const etcdKey = `${realmName}/required_actions`;

    const etcdRealmNameKeys = await this.etcd.get(etcdKey).string();

    this.logger.info({
      msg: 'realm_middleware_init',
      etcd_key: etcdKey,
      etcd: etcdRealmNameKeys,
      realm_name: realmName,
    });

    if (etcdRealmNameKeys == null) {
      throw new DefaultError({
        status: 500,
        code: FailureCode.SERVER_ERROR,
        source: 'realm_middleware',
        additional: {
          headers: req.headers,
          etcd_key: etcdKey,
        },
        message: 'cannot_get_data_from_etcd',
      });
    }

    if (realmName == null) {
      throw new DefaultError({
        status: 400,
        code: FailureCode.BAD_REQUEST,
        message: 'invalid_realm_param',
        additional: { headers: req.headers },
      });
    }

    const vaultResponse = await this.vault.readSecretVersion(
      'keycloak_clients',
    );

    if (vaultResponse.status !== 'OK') {
      throw new DefaultError({
        status: 400,
        code: FailureCode.SERVER_ERROR,
        message: 'Cant get data from Vault',
      });
    }

    if (vaultResponse.data.data[realmName] == null) {
      throw new DefaultError({
        status: 400,
        code: FailureCode.BAD_REQUEST,
        source: 'realm_middleware',
        message: 'invalid_realm_param_with_vault',
        additional: {
          realm_name: realmName,
          keycloak_data: vaultResponse.data.data,
        },
      });
    }
    req.realm_name = realmName;
    this.logger.debug({ msg: 'request_realm', realm_name: req.realm_name });
    next();
  }
}
