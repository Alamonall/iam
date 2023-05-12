import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Axios, AxiosResponse } from 'axios';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { decode, JwtPayload } from 'jsonwebtoken';
import { FailureCode } from '../filters/FailureCode';
import { Action } from '../registration/types';
import VaultService from '../vault/vault.service';
import DefaultError from '../filters/DefaultError';

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type UpdateUserParams = {
  searchBy: string;
  searchValue: string;
  newValue: string;
  realmName: string;
};

type UpdateUserHandler = {
  [x: string]: (args: UpdateUserParams) => Promise<void>;
};
@Injectable()
export default class KeycloakService {
  clientId: string;

  clientsSecrets: Record<string, string>;

  baseUrl: string;

  axios: Axios;

  accessTokenExpireGapInSeconds: number;

  updateUserHandlers: UpdateUserHandler;

  constructor(
    @InjectPinoLogger(KeycloakService.name) private readonly logger: PinoLogger,
    private readonly config: ConfigService,
    private readonly vault: VaultService,
  ) {
    this.clientId = this.config.getOrThrow('keycloakClientId');
    this.baseUrl = this.config.getOrThrow('keycloakBaseUrl');
    this.accessTokenExpireGapInSeconds = this.config.getOrThrow(
      'accessTokenExpireGapInSeconds',
    );
    this.updateUserHandlers = {
      password: this.updatePassword,
    };
  }

  async init(): Promise<void> {
    const vaultResponse = await this.vault.readSecretVersion(
      'keycloak_clients',
    );
    if (vaultResponse.status !== 'OK') {
      throw new Error('Cant get data from Vault');
    }

    this.clientsSecrets = vaultResponse.data.data;
    this.axios = new Axios({ baseURL: this.baseUrl });
    this.logger.info({ msg: 'keycloak_init' });
  }

  async authUser({
    username,
    password,
    realmName,
  }: {
    username: string;
    password: string;
    realmName: string;
  }): Promise<TokenSet> {
    const route = 'keycloak_auth_user';
    this.logger.info({
      msg: 'trying_auth_user',
      route,
      username,
      realm_name: realmName,
    });

    if (realmName == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: { username, realm_name: realmName },
      });
    }

    const kcAdminClient = new KcAdminClient({
      baseUrl: this.baseUrl,
      realmName,
    });

    this.logger.info({
      msg: 'client_authorized',
      client_id: this.clientId,
      route,
      username,
      realm_name: realmName,
    });

    try {
      await kcAdminClient.auth({
        clientId: this.clientId,
        clientSecret: this.clientsSecrets[realmName],
        grantType: 'password',
        username,
        password,
      });
    } catch (error) {
      if (error.isAxiosError && error.response.status === 401) {
        throw new DefaultError({
          code: FailureCode.UNAUTHORIZED,
          status: 401,
          message: 'failed_to_auth_user_on_keycloak',
          source: route,
          additional: { username, realm_name: realmName, ...error },
        });
      }
      throw new DefaultError({
        code: FailureCode.SERVER_ERROR,
        status: 500,
        message: 'failed_to_post_auth_request_to_keycloak',
        source: route,
        additional: { username, realm_name: realmName, ...error },
      });
    }

    if (
      kcAdminClient.accessToken == null ||
      kcAdminClient.refreshToken == null
    ) {
      throw new DefaultError({
        code: FailureCode.SERVER_ERROR,
        status: 500,
        message: 'token_set_is_null',
        source: route,
        additional: {
          username,
          realm_name: realmName,
          access_token: kcAdminClient.accessToken,
          refresh_token: kcAdminClient.refreshToken,
        },
      });
    }

    this.logger.info({ msg: 'user_authorized', route, username });

    const decodedAccessToken: JwtPayload | null = decode(
      kcAdminClient.accessToken,
      {
        json: true,
      },
    );

    if (decodedAccessToken == null || decodedAccessToken.exp == null) {
      throw new DefaultError({
        code: FailureCode.SERVER_ERROR,
        status: 500,
        message: 'failed_to_decode_access_token',
        source: route,
        additional: {
          username,
          realm_name: realmName,
          decoded_access_token: decodedAccessToken,
        },
      });
    }

    return {
      accessToken: kcAdminClient.accessToken,
      refreshToken: kcAdminClient.refreshToken,
      // Сделано для того, чтобы у фронта не ломались запросы при 401
      expiresIn: decodedAccessToken.exp - this.accessTokenExpireGapInSeconds,
    };
  }

  async createUser({
    username,
    password,
    email,
    phone,
    realmName,
  }: {
    username: string;
    password: string;
    email?: string | null;
    phone?: string | null;
    realmName: string;
  }): Promise<void> {
    const route = 'keycloak_create_user';
    const kcAdminClient = new KcAdminClient({
      baseUrl: this.baseUrl,
      realmName,
    });

    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: this.clientId,
      clientSecret: this.clientsSecrets[realmName],
    });

    if (kcAdminClient.accessToken == null) {
      throw new DefaultError({
        code: FailureCode.SERVER_ERROR,
        status: 500,
        message: 'failed_to_get_client_access_token',
        source: route,
        additional: {
          username,
          realm_name: realmName,
          client_id: this.clientId,
        },
      });
    }

    const usersWithThisEmail = await this.getUsersByParams({
      searchBy: Action.email,
      value: email,
      realmName,
    });

    if (usersWithThisEmail.length > 0) {
      throw new DefaultError({
        code: FailureCode.CONFLICT,
        status: 409,
        message: 'failed_to_find_users_with_given_email',
        source: route,
        additional: {
          client_id: this.clientId,
          username,
          email,
          realm_name: realmName,
        },
      });
    }

    const usersWithThisPhone: Array<UserRepresentation> =
      await this.getUsersByParams({
        searchBy: Action.phone,
        value: phone,
        realmName,
      });

    if (usersWithThisPhone.length > 0) {
      throw new DefaultError({
        code: FailureCode.CONFLICT,
        status: 409,
        message: 'user_with_this_phone_already_exits',
        source: route,
        additional: {
          client_id: this.clientId,
          username,
          email,
          realm_name: realmName,
        },
      });
    }

    await kcAdminClient.users.create({
      username,
      email,
      enabled: true,
      attributes: {
        phone,
      },
      credentials: [
        {
          temporary: false,
          type: 'password',
          value: password,
        },
      ],
    });
  }

  async updateUser({
    subject,
    newValue,
    realmName,
    searchBy,
    searchValue,
  }: {
    subject: string;
    newValue: string;
    realmName: string;
    searchBy: string;
    searchValue: string;
  }): Promise<void> {
    const route = 'update_user';
    this.logger.info({
      msg: 'update_user',
      route,
      subject,
      newValue,
      realmName,
      searchBy,
      searchValue,
    });
    await this.updateUserHandlers[subject].call(this, {
      searchBy,
      searchValue,
      newValue,
      realmName,
    });
  }

  private async updatePassword({
    searchBy,
    searchValue,
    newValue,
    realmName,
  }: UpdateUserParams): Promise<void> {
    const route = 'keycloak_service_update_password';
    this.logger.info({
      msg: 'in_update_password',
      route,
      search_by: searchBy,
      search_value: searchValue,
      realm_name: realmName,
    });
    const kcAdminClient = new KcAdminClient({
      baseUrl: this.baseUrl,
      realmName,
    });

    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: this.clientId,
      clientSecret: this.clientsSecrets[realmName],
    });

    const users: Array<UserRepresentation> = await this.getUsersByParams({
      searchBy,
      value: searchValue,
      realmName,
    });

    if (users.length === 0) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'user_not_found',
        source: route,
        additional: {
          client_id: this.clientId,
          search_by: searchBy,
          search_value: searchValue,
          realm_name: realmName,
        },
      });
    }

    if (users[0] === null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'user_is_null',
        source: route,
        additional: {
          client_id: this.clientId,
          search_by: searchBy,
          search_value: searchValue,
          realm_name: realmName,
        },
      });
    }

    await kcAdminClient.users.resetPassword({
      id: users[0].id,
      credential: {
        temporary: false,
        type: 'password',
        value: newValue,
      },
    });
  }

  async refreshToken({
    realmName,
    refreshToken,
  }: {
    realmName: string;
    refreshToken: string;
  }): Promise<TokenSet> {
    const route = 'keycloak_refresh_token';
    this.logger.info({
      msg: 'trying_to_refresh_token',
      route,
      realm_name: realmName,
    });
    if (realmName == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          client_id: this.clientId,
          realm_name: realmName,
        },
      });
    }

    const kcAdminClient = new KcAdminClient({
      baseUrl: this.baseUrl,
      realmName,
    });

    try {
      await kcAdminClient.auth({
        grantType: 'refresh_token',
        clientId: this.clientId,
        clientSecret: this.clientsSecrets[realmName],
        refreshToken,
      });
    } catch (err: any) {
      const error = {
        code: FailureCode.SERVER_ERROR,
        status: 500,
        message: 'failed_to_refresh_token_on_keycloak',
        source: route,
        additional: err,
      };
      if (err.isAxiosError && err.response.status === 401) {
        throw new DefaultError({
          ...error,
          code: FailureCode.UNAUTHORIZED,
          status: 400,
        });
      }
      throw new DefaultError(error);
    }

    if (
      kcAdminClient.accessToken == null ||
      kcAdminClient.refreshToken == null
    ) {
      throw new DefaultError({
        code: FailureCode.SERVER_ERROR,
        status: 500,
        message: 'failed_to_get_tokens',
        source: route,
        additional: {
          client_id: this.clientId,
          realm_name: realmName,
          access_token: kcAdminClient.accessToken,
          refresh_token: kcAdminClient.refreshToken,
        },
      });
    }

    const decodedAccessToken: JwtPayload | null = decode(
      kcAdminClient.accessToken,
      {
        json: true,
      },
    );

    return {
      accessToken: kcAdminClient.accessToken,
      refreshToken: kcAdminClient.refreshToken,
      // Сделано для того, чтобы у фронта не ломались запросы при 401
      expiresIn: decodedAccessToken.exp - this.accessTokenExpireGapInSeconds,
    };
  }

  async getUsersByParams({
    searchBy,
    value,
    realmName,
  }: {
    searchBy: string;
    value: string | null;
    realmName: string;
  }): Promise<Array<UserRepresentation>> {
    const route = 'get_users_by_params';
    if (value == null) {
      return [];
    }
    if (realmName == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          client_id: this.clientId,
          realm_name: realmName,
          searchBy,
          value,
        },
      });
    }

    const kcAdminClient = new KcAdminClient({
      baseUrl: this.baseUrl,
      realmName,
    });

    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: this.clientId,
      clientSecret: this.clientsSecrets[realmName],
    });

    this.logger.info({
      msg: 'client_authorized',
      client_id: this.clientId,
      route,
      search_by: searchBy,
      value,
      realm_name: realmName,
    });

    const url = `admin/realms/${encodeURIComponent(realmName)}/users`;
    const keycloakResponse: AxiosResponse<
      any,
      Array<UserRepresentation>
    > = await this.axios.get(url, {
      params: { q: `${searchBy}:${value}` },
      headers: {
        Authorization: `Bearer ${kcAdminClient.accessToken}`,
      },
    });

    return JSON.parse(keycloakResponse.data);
  }
}
