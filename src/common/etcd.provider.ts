import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Etcd3, Namespace } from 'etcd3';
import { readFileSync } from 'fs';
import { PinoLogger } from 'nestjs-pino';
import { resolve } from 'path';
import { ETCD } from './constants';

function createClient(config: ConfigService, logger: PinoLogger): Namespace {
  const uri = config.getOrThrow<string>('etcdUri');
  const certPath = config.getOrThrow<string>('rootCaCertPath');
  const namespace = config.getOrThrow<string>('etcdNamespace');

  logger.info({
    msg: 'etcd_init',
    uri,
    cert_path: certPath,
    namespace,
  });

  const client = new Etcd3({
    credentials: {
      rootCertificate: readFileSync(resolve(__dirname, certPath)),
    },
    hosts: [uri.replace(/\/$/, '')],
  });
  return client.namespace(namespace);
}

// eslint-disable-next-line import/prefer-default-export
export const EtcdProvider: FactoryProvider<Namespace> = {
  provide: ETCD,
  useFactory: createClient,
  inject: [ConfigService, PinoLogger],
};
