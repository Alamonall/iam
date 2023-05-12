import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  sign,
  verify,
  Algorithm,
  JwtPayload,
  JsonWebTokenError,
} from 'jsonwebtoken';
import * as NodeRSA from 'node-rsa';
import { ConfigService } from '@nestjs/config';
import VaultService from '../vault/vault.service';
import { SERVICE_NAME } from '../common/constants';
import { FailureCode } from '../filters/FailureCode';
import { JwtContext, JwtType } from './types';
import { Action, ActionCode } from '../registration/types';
import DefaultError from '../filters/DefaultError';

export type JwtMetadata = {
  context_id: string;
  context: JwtContext;
  required_actions: Array<Action>;
  realm_name: string;
  on_verification: ActionCode;
};
@Injectable()
export default class JwtService {
  private privateKey: string;

  private publicKey: string;

  private algorithm: Algorithm = 'RS512';

  private nodeRSA: NodeRSA;

  tokenExpirationTime: number;

  constructor(
    private readonly config: ConfigService,
    private readonly vaultService: VaultService,
    @InjectPinoLogger(JwtService.name) private readonly logger: PinoLogger,
    @Inject(SERVICE_NAME) private readonly serviceName: string,
  ) {
    this.tokenExpirationTime = this.config.getOrThrow('tokenExpirationTime');
  }

  async init() {
    this.logger.info({ msg: 'jwt_service_init' });
    const vaultResponse = await this.vaultService.readSecretVersion(
      'token_keys',
    );

    if (vaultResponse.status !== 'OK') {
      throw new Error(
        `Cannot get data from vault cuz: ${JSON.stringify(vaultResponse)}`,
      );
    }
    this.privateKey = vaultResponse.data.data.private_key;
    this.publicKey = vaultResponse.data.data.public_key;
    this.nodeRSA = new NodeRSA(this.privateKey);
  }

  encode({
    context_id,
    context,
    type,
    required_actions,
    realm_name,
    on_verification,
  }: JwtMetadata & {
    type: JwtType;
  }): string {
    const encodedContext = this.nodeRSA.encrypt(context, 'base64');

    this.logger.debug({
      msg: 'encoded_cxt',
      context_id,
      type,
      required_actions,
      realm_name,
      on_verification,
    });
    const jwtToken = sign(
      {
        context_id,
        context: encodedContext,
        type,
        required_actions,
        realm_name,
        on_verification,
      },
      this.privateKey,
      {
        algorithm: this.algorithm,
        expiresIn: this.tokenExpirationTime,
        issuer: this.serviceName,
        header: {
          alg: this.algorithm,
          typ: type,
        },
      },
    );

    return jwtToken;
  }

  decode({
    token,
    type,
    ignoreExpiration = false,
  }: {
    token: string;
    type: JwtType;
    ignoreExpiration?: boolean;
  }): JwtMetadata {
    try {
      const { payload }: JwtPayload = verify(token, this.publicKey, {
        complete: true,
        issuer: this.serviceName,
        ignoreExpiration,
      });

      if (payload.type !== type) {
        throw new DefaultError({
          code: FailureCode.FORBIDDEN,
          status: 403,
          message: 'wrong_type_of_jwt_token',
          source: 'jwt_service_decode',
        });
      }

      const decodedContextString = this.nodeRSA.decrypt(
        payload.context,
        'utf8',
      );

      const decodedContext: JwtContext = JSON.parse(decodedContextString);

      return {
        context_id: payload.context_id,
        context: decodedContext,
        required_actions: payload.required_actions,
        realm_name: payload.realm_name,
        on_verification: payload.on_verification,
      };
    } catch (err: any) {
      const error: JsonWebTokenError = err;
      if (error.name === 'TokenExpiredError')
        throw new DefaultError({
          code: FailureCode.EXPIRED,
          status: 400,
          message: 'token_expired_error',
          source: 'jwt_service_decode',
          additional: error,
        });
      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        status: 403,
        message: 'jwt_service_error',
        source: 'jwt_service_decode',
        additional: error,
      });
    }
  }
}
