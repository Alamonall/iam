/* eslint-disable @typescript-eslint/no-empty-function */
import { Inject, Injectable } from '@nestjs/common';
import newId from '@acme/good-id';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Etcd3 } from 'etcd3';
import AffirmationService from '../affirmation/affirmation.service';
import { getActionByCode, getCodeByAction, isAllVerified } from '../utils';
import { FailureCode } from '../filters/FailureCode';
import JwtService, { JwtMetadata } from '../jwt/jwt.service';
import { JwtContext, JwtContextSubject, JwtType } from '../jwt/types';
import { RefreshAccessRequest } from './types/RefreshAccessRequest';
import { RefreshAccessResponse } from './types/RefreshAccessResponse';
import KeycloakService from '../keycloak/keycloak.service';
import PasswordResetResponse from './types/InitResetPasswordResponse';
import { Action, ActionCode } from '../registration/types';
import RecoveryInitAffirmationRequest from './types/RecoveryInitAffirmationRequest';
import RecoveryInitAffirmationResponse from './types/RecoveryInitAffirmationResponse';
import RecoveryCompleteAffirmationRequest from './types/RecoveryCompleteAffirmationRequest';
import RecoveryCompleteAffirmationResponse from './types/RecoveryCompleteAffirmationResponse';
import CompleteResetPasswordRequest from './types/CompleteResetPasswordRequest';
import { ResendResponse } from './types/ResendResponse';
import { ResendRequest } from './types/ResendRequest';
import { ETCD } from '../common/constants';
import DefaultError from '../filters/DefaultError';

@Injectable()
export default class RecoveryService {
  private readonly iamProcessName = 'recovery';

  constructor(
    private readonly jwtService: JwtService,
    private readonly affirmationService: AffirmationService,
    private readonly keycloakService: KeycloakService,
    @InjectPinoLogger(RecoveryService.name) private readonly logger: PinoLogger,
    @Inject(ETCD)
    private readonly etcd: Etcd3,
  ) {}

  async init({
    realm_name: realmName,
  }: Required<
    Pick<JwtMetadata, 'realm_name'>
  >): Promise<PasswordResetResponse> {
    const route = 'recovery_init';
    const contextId: string = newId('ctx');

    const context: JwtContext = new Map<Action, JwtContextSubject>();

    const requiredActions = await this.etcd.get(
      `${realmName}/required_actions`,
    );

    const parsedRequiredActions: Array<Action> = JSON.parse(requiredActions);

    this.logger.info({
      msg: 'required_actions_etcd',
      route,
      context_id: contextId,
      required_actions: parsedRequiredActions,
    });

    const passwordResetToken: string = this.jwtService.encode({
      context_id: contextId,
      context,
      required_actions: parsedRequiredActions,
      realm_name: realmName,
      on_verification: null,
      type: JwtType.PASSWORD_RESET,
    });

    this.logger.debug({
      msg: 'tokens_and_actions',
      token: passwordResetToken,
      actions: parsedRequiredActions,
    });
    return {
      reset_password_token: passwordResetToken,
      required_actions: parsedRequiredActions,
    };
  }

  async initAffirmation({
    realm_name: realmName,
    reset_password_token,
    action,
    value,
  }: RecoveryInitAffirmationRequest &
    Required<
      Pick<JwtMetadata, 'realm_name'>
    >): Promise<RecoveryInitAffirmationResponse> {
    const route = 'password_reset_init_affirmation';
    this.logger.debug({
      msg: 'init',
      route,
      action,
      value,
      realm_name: realmName,
    });
    const {
      context_id: contextId,
      context,
      required_actions: requiredActions,
      realm_name: realmNameFromToken,
      on_verification: onVerification,
    } = this.jwtService.decode({
      token: reset_password_token,
      type: JwtType.PASSWORD_RESET,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          token_realm: realmNameFromToken,
          realm_name: realmName,
        },
      });
    }

    if (requiredActions.indexOf(action) === -1) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_action',
        source: route,
        additional: {
          required_actions: requiredActions,
          action,
          realm_name: realmName,
        },
      });
    }

    if (onVerification != null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'something_on_verification',
        source: route,
        additional: {
          required_actions: requiredActions,
          action,
          realm_name: realmName,
          on_verification: onVerification,
        },
      });
    }

    context[action] = { ...context[action], subject_value: value };
    this.logger.debug({
      msg: 'ctx_updated',
      subject_data: context,
    });

    const { context: newContext, mask } = await this.affirmationService.start({
      contextId,
      action,
      value,
      context,
      type: this.iamProcessName,
    });

    const code: ActionCode = getCodeByAction({ action });
    const resetPasswordToken = this.jwtService.encode({
      context_id: contextId,
      context: newContext,
      required_actions: [action],
      on_verification: code,
      realm_name: realmName,
      type: JwtType.PASSWORD_RESET,
    });

    return {
      reset_password_token: resetPasswordToken,
      required_actions: [code],
      resend_date: newContext[action].resend_date,
      mask,
    };
  }

  async completeAffirmation({
    realm_name: realmName,
    reset_password_token,
    action: actionCode,
    value,
    secret,
  }: RecoveryCompleteAffirmationRequest &
    Required<
      Pick<JwtMetadata, 'realm_name'>
    >): Promise<RecoveryCompleteAffirmationResponse> {
    const route = 'recovery_reset_password_complete_affirmation';
    this.logger.debug({
      msg: 'init_reset_pass_compl_affirmation',
      route,
      actionCode,
      value,
      realm_name: realmName,
    });
    const action = getActionByCode({ code: actionCode });
    const {
      context_id: contextId,
      context,
      required_actions: requiredActions,
      realm_name: realmNameFromToken,
      on_verification: onVerification,
    }: JwtMetadata = this.jwtService.decode({
      token: reset_password_token,
      type: JwtType.PASSWORD_RESET,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (onVerification == null || onVerification !== actionCode) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'something_on_verification',
        source: route,
        additional: {
          request_realm: realmName,
          token_realm: realmNameFromToken,
          on_verification: onVerification,
        },
      });
    }

    context[action] = {
      ...context[action],
      secret,
    };
    const { context: newContext } = await this.affirmationService.complete({
      contextId,
      context,
      action: actionCode,
      value,
      type: this.iamProcessName,
    });

    const newRequiredActions: Array<Action> = requiredActions.filter(
      (requiredAction: Action) => !action.includes(requiredAction),
    );

    const resetPasswordToken = this.jwtService.encode({
      context_id: contextId,
      context: newContext,
      required_actions: newRequiredActions,
      on_verification: null,
      realm_name: realmName,
      type: JwtType.PASSWORD_RESET,
    });

    return {
      required_actions: newRequiredActions,
      reset_password_token: resetPasswordToken,
    };
  }

  async complete({
    realm_name: realmName,
    reset_password_token,
  }: CompleteResetPasswordRequest &
    Required<Pick<JwtMetadata, 'realm_name'>>): Promise<void> {
    const route = 'complete_reset_password';
    const {
      context_id: contextId,
      context,
      realm_name: realmNameFromToken,
      required_actions: requiredActions,
      on_verification: onVerification,
    }: JwtMetadata = this.jwtService.decode({
      token: reset_password_token,
      type: JwtType.PASSWORD_RESET,
    });

    this.logger.info({
      msg: 'realms',
      route,
      context_id: contextId,
      req_realm: realmName,
      token_realm: realmNameFromToken,
    });
    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          context_id: contextId,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (!isAllVerified(context)) {
      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        status: 403,
        message: 'not_all_subject_verified',
        source: route,
        additional: {
          context_id: contextId,
          context,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (onVerification != null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'something_still_on_verification',
        source: route,
        additional: {
          context_id: contextId,
          on_verification: onVerification,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (requiredActions.length !== 0) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'not_finished_required_actions',
        source: route,
        additional: {
          context_id: contextId,
          required_actions: requiredActions,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    const subject = Object.entries(context)[0];

    if (subject == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_ctx',
        source: route,
        additional: {
          context_id: contextId,
          subject,
        },
      });
    }

    if (
      subject[0] == null ||
      subject[1].subject_value == null ||
      subject[1].secret == null
    ) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_subject_data',
        source: route,
        additional: {
          context_id: contextId,
          subject,
        },
      });
    }

    await this.keycloakService.updateUser({
      subject: 'password',
      newValue: subject[1].secret,
      searchBy: subject[0],
      searchValue: subject[1].subject_value,
      realmName,
    });
  }

  async resend({
    token,
    realm_name: realmName,
    jwt_type: jwtType,
  }: ResendRequest & {
    realm_name: string;
    jwt_type: JwtType;
  }): Promise<ResendResponse> {
    const route = 'recovery_resend';
    const {
      context_id: contextId,
      context,
      realm_name: realmNameFromToken,
      on_verification: onVerification,
      required_actions: requiredActions,
    }: JwtMetadata = this.jwtService.decode({
      token,
      type: jwtType,
      ignoreExpiration: true,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          context_id: contextId,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (onVerification == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'something_wrong_on_verification',
        source: route,
        additional: {
          context_id: contextId,
          on_verification: onVerification,
        },
      });
    }

    const action = getActionByCode({ code: onVerification });
    context[action] = {
      ...context[action],
      resend_date: null,
      verification_code: null,
    };

    if (context[action].verified || context[action].subject_value == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'subject_already_verified',
        source: route,
        additional: {
          context_id: contextId,
          subject: context[action],
        },
      });
    }

    const { context: newContext, mask } = await this.affirmationService.start({
      contextId,
      action,
      value: context[action].subject_value,
      context,
      type: this.iamProcessName,
    });

    const newRequiredActions: Array<Action> = requiredActions.filter(
      (requiredAction: Action) => !action.includes(requiredAction),
    );

    const newToken = this.jwtService.encode({
      context_id: contextId,
      context: newContext,
      required_actions: newRequiredActions,
      on_verification: onVerification,
      realm_name: realmName,
      type: jwtType,
    });

    return {
      token: newToken,
      resend_date: newContext[action].resend_date,
      required_actions: [onVerification],
      mask,
    };
  }

  async refreshAccess({
    refresh_token: refreshToken,
    realm_name: realmName,
  }: RefreshAccessRequest &
    Required<Pick<JwtMetadata, 'realm_name'>>): Promise<RefreshAccessResponse> {
    const tokenSet = await this.keycloakService.refreshToken({
      refreshToken,
      realmName,
    });

    const expiresAt = new Date(tokenSet.expiresIn * 1000);

    return {
      access_token: tokenSet.accessToken,
      refresh_token: tokenSet.refreshToken,
      expires_at: expiresAt.toISOString(),
    };
  }
}
